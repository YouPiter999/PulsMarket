import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';
import realData from '@/lib/real-data.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getFirestoreDb();
    
    if (!realData || !Array.isArray(realData)) {
      return NextResponse.json({ success: false, error: 'Data not found' });
    }
    
    let batch = db.batch();
    let count = 0;
    
    for (const item of realData) {
      if (!item.id) continue;
      const docRef = db.collection('listings').doc(item.id);
      batch.set(docRef, item, { merge: true });
      count++;
      
      if (count % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    
    if (count % 400 !== 0) {
      await batch.commit();
    }
    
    return NextResponse.json({ success: true, count });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
