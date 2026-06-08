import { MetadataRoute } from 'next'
import { getFirestoreDb } from '@/lib/firebaseAdmin';

// Generate the sitemap on-request instead of at build time. This guarantees a
// slow Firestore query can never break the production build (it previously
// timed out and aborted the whole deploy).
export const dynamic = 'force-dynamic';

// Helper: race a promise against a timeout so the build can never hang on Firestore.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`sitemap Firestore query timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pulsemarket-group-app.web.app';

  // 1. Get all active listings from Firestore
  let dynamicUrls: MetadataRoute.Sitemap = [];
  try {
    const db = getFirestoreDb();
    // Only select the lightweight fields we actually need.
    // CRITICAL: never pull image_url here — many docs store huge inline base64
    // data URIs that bloat the response and make the build time out.
    const snapshot = await withTimeout(
      db.collection('listings')
        .orderBy('createdAt', 'desc')
        .limit(500) // Get up to 500 latest items
        .select('status', 'updatedAt', 'createdAt')
        .get(),
      12000 // 12s hard cap — if Firestore is slow, fall back to static-only sitemap
    );

    dynamicUrls = snapshot.docs
      .map((doc: any) => {
        const data = doc.data() as any;
        return { id: doc.id, ...data };
      })
      // Filter by 'active' in-memory to bypass Firestore index requirements
      .filter((data: any) => data.status === 'active')
      .map((data: any) => {
        const timestamp = data.updatedAt || data.createdAt || new Date().toISOString();
        return {
          url: `${baseUrl}/listing/${data.id}`,
          lastModified: new Date(timestamp),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        };
      });
  } catch (error) {
    // Never fail the build because of the sitemap — just return static URLs.
    console.error("Error generating dynamic sitemap (returning static-only):", error);
  }

  // 2. Base static site paths
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    }
  ];

  return [...staticUrls, ...dynamicUrls];
}
