import { getFirestoreDb } from '@/lib/firebaseAdmin';
import HomeClient, { Listing } from './HomeClient';

export const revalidate = 30; // Revalidate the home page every 30 seconds for instant loads without cold starts

export default async function Home() {
  try {
    const db = getFirestoreDb();
    const [generalSnapshot, prioritySnapshot] = await Promise.all([
      db.collection('listings')
        .orderBy('createdAt', 'desc')
        .limit(250)
        .get(),
      db.collection('listings')
        .where('is_priority', '==', true)
        .limit(100)
        .get()
    ]);

    const mergedDocs = new Map<string, any>();
    generalSnapshot.docs.forEach((doc: any) => mergedDocs.set(doc.id, { id: doc.id, ...doc.data() }));
    prioritySnapshot.docs.forEach((doc: any) => mergedDocs.set(doc.id, { id: doc.id, ...doc.data() }));

    const listings = Array.from(mergedDocs.values()).map((data: any) => {
      return {
        id: data.id,
        title: data.title,
        price: data.price,
        currency: data.currency,
        category: data.category,
        location: data.location,
        createdAt: data.createdAt,
        image_url: data.image_url,
        country: data.country,
        verified_badge: data.verified_badge,
        description: data.description ? (data.description.length > 150 ? data.description.substring(0, 150) + '...' : data.description) : '',
        type: data.type,
        is_priority: data.is_priority || false,
        source: data.source || '',
        username: data.username || ''
      };
    }) as Listing[];

    // Sort by createdAt descending
    listings.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const nextCursor = generalSnapshot.docs.length === 250 ? generalSnapshot.docs[generalSnapshot.docs.length - 1].id : null;

    return <HomeClient initialListings={listings} initialNextCursor={nextCursor} />;
  } catch (error) {
    console.error('Failed to fetch listings for home page:', error);
    // Fallback to empty list if DB fails
    return <HomeClient initialListings={[]} initialNextCursor={null} />;
  }
}
