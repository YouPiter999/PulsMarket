import { getFirestoreDb } from '@/lib/firebaseAdmin';
import HomeClient, { Listing } from './HomeClient';
import { resolveCategory } from '@/components/CategoryGrid';

export const dynamic = 'force-dynamic'; // Force dynamic rendering on every request to show live Firestore data and bypass ISR caching issues on Firebase Functions

export default async function Home() {
  try {
    const db = getFirestoreDb();
    const defaultCountry = 'Северный Кипр';

    let generalSnapshot;
    let prioritySnapshot;

    try {
      [generalSnapshot, prioritySnapshot] = await Promise.all([
        db.collection('listings')
          .where('country', '==', defaultCountry)
          .orderBy('createdAt', 'desc')
          .limit(250)
          .get(),
        db.collection('listings')
          .where('country', '==', defaultCountry)
          .where('is_priority', '==', true)
          .limit(100)
          .get()
      ]);
    } catch (e) {
      console.warn("Index warning in SSR page.tsx: fallback to memory filter", e);
      [generalSnapshot, prioritySnapshot] = await Promise.all([
        db.collection('listings')
          .orderBy('createdAt', 'desc')
          .limit(400)
          .get(),
        db.collection('listings')
          .where('is_priority', '==', true)
          .limit(100)
          .get()
      ]);
    }

    const mergedDocs = new Map<string, any>();
    generalSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      if ((data.country || 'Северный Кипр') === defaultCountry) {
        mergedDocs.set(doc.id, { id: doc.id, ...data });
      }
    });
    prioritySnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      if ((data.country || 'Северный Кипр') === defaultCountry) {
        mergedDocs.set(doc.id, { id: doc.id, ...data });
      }
    });

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

    const filteredGeneralDocs = generalSnapshot.docs.filter((doc: any) => {
      const data = doc.data();
      return (data.country || 'Северный Кипр') === defaultCountry;
    });
    const nextCursor = filteredGeneralDocs.length >= 250 ? filteredGeneralDocs[filteredGeneralDocs.length - 1].id : null;

    // Fetch initial stats for 'Северный Кипр' (SSR/ISR)
    const statsSnapshot = await db.collection('listings')
      .where('country', '==', 'Северный Кипр')
      .select('category', 'createdAt')
      .get();

    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const nineDaysAgo = new Date(Date.now() - 777600000).toISOString();

    let countHour = 0;
    let countDay = 0;
    let countNineDays = 0;
    const categoryCounts: Record<string, number> = {};

    statsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      const cat = resolveCategory(data.category);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      if (data.createdAt) {
        if (data.createdAt >= oneHourAgo) countHour++;
        if (data.createdAt >= oneDayAgo) countDay++;
        if (data.createdAt >= nineDaysAgo) countNineDays++;
      }
    });

    categoryCounts['Все'] = statsSnapshot.size;

    const initialStats = {
      total: statsSnapshot.size,
      countHour,
      countDay,
      countNineDays,
      categoryCounts
    };

    return <HomeClient initialListings={listings} initialNextCursor={nextCursor} initialStats={initialStats} />;
  } catch (error) {
    console.error('Failed to fetch listings for home page:', error);
    // Fallback to empty list if DB fails
    return <HomeClient initialListings={[]} initialNextCursor={null} />;
  }
}
