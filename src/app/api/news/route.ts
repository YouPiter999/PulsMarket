import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getFirestoreDb();
    
    // Fetch all news items. Since we do not combine equality with orderBy, 
    // this does NOT require a composite index.
    let docs = [];
    try {
      // Пробуем оптимальный запрос (требует составного индекса category == 'Новости' + createdAt desc)
      const snapshot = await db.collection('listings')
        .where('category', '==', 'Новости')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      docs = snapshot.docs;
    } catch (indexError: any) {
      console.warn('News index missing, falling back to memory sort. Create index here: https://console.firebase.google.com', indexError.message);
      
      // Fallback: берем больше документов без индекса и отсортируем в памяти
      const snapshot = await db.collection('listings')
        .where('category', '==', 'Новости')
        .limit(200) // берем до 200 новостей
        .get();
      docs = snapshot.docs;
    }
      
    const news = docs.map((doc: any) => {
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
    
    // Всегда сортируем по дате по убыванию
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
