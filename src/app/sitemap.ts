import { MetadataRoute } from 'next'
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pulsemarket-group-app.web.app';
  
  // 1. Get all active listings from Firestore
  let dynamicUrls: MetadataRoute.Sitemap = [];
  try {
    const db = getFirestoreDb();
    const snapshot = await db.collection('listings')
      .orderBy('createdAt', 'desc')
      .limit(1000) // Get up to 1000 latest active items
      .get();
      
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
    console.error("Error generating dynamic sitemap:", error);
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
