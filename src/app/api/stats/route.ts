import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';
import { resolveCategory } from '@/components/CategoryGrid';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getFirestoreDb();
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'Северный Кипр';

    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const nineDaysAgo = new Date(Date.now() - 777600000).toISOString();
    
    const snapshot = await db.collection('listings')
      .where('country', '==', country)
      .get();
      
    let countHour = 0;
    let countDay = 0;
    let countNineDays = 0;
    const categoryCounts: Record<string, number> = {};
    
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      
      // Count ALL listings for categories
      const cat = resolveCategory(data.category);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      if (data.createdAt) {
        if (data.createdAt >= oneHourAgo) countHour++;
        if (data.createdAt >= oneDayAgo) countDay++;
        if (data.createdAt >= nineDaysAgo) {
          countNineDays++;
        }
      }
    });

    categoryCounts['Все'] = snapshot.size;

    return NextResponse.json({
      success: true,
      stats: {
        total: snapshot.size,
        countHour,
        countDay,
        countNineDays,
        categoryCounts
      }
    });
  } catch (error: any) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
