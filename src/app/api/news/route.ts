import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getFirestoreDb();
    
    // Fetch all news items. Since we do not combine equality with orderBy, 
    // this does NOT require a composite index.
    const snapshot = await db.collection('listings')
      .where('category', '==', 'Новости')
      .limit(100) // Safety limit
      .get();
      
    const news = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
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
        type: data.type
      };
    });
    
    // Sort in memory by createdAt descending
    news.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ success: true, news: news.slice(0, 10) });
  } catch (error: any) {
    console.error('News API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
