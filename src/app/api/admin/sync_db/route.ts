import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔄 Starting Cloud Data Sync...');
    const db = getFirestoreDb();
    
    // Fetch the entire production dump from the currently active backup environment
    const response = await fetch('https://pulsemarket-group-app.web.app/api/listings', {
       cache: 'no-store'
    });
    
    if (!response.ok) {
       throw new Error(`Source API failed with status: ${response.status}`);
    }
    
    const listings = await response.json();
    
    if (!Array.isArray(listings) || listings.length === 0) {
       return NextResponse.json({ success: false, message: 'No source listings found' });
    }

    console.log(`📥 Fetched ${listings.length} source listings. Initializing Firestore migration...`);
    
    let migratedCount = 0;
    let batchCount = 0;
    
    // Standard Firestore batch allows up to 500 writes. Let's batch them efficiently.
    let batch = db.batch();
    
    for (const item of listings) {
      if (!item.id) continue;
      
      const src = String(item.source || '').toLowerCase();
      // Explicitly guarantee priority for the supreme channel if not already marked
      const isSupreme = src.includes('northcyprus_island');
      
      // Deep copy object to remove unwanted properties if any
      const cleanItem = {
        ...item,
        is_priority: isSupreme ? true : (item.is_priority === true)
      };
      
      const docRef = db.collection('listings').doc(item.id);
      batch.set(docRef, cleanItem, { merge: true });
      migratedCount++;
      batchCount++;
      
      // If we hit standard 400 batch count, flush to save and start a new batch
      if (batchCount >= 400) {
         await batch.commit();
         batch = db.batch();
         batchCount = 0;
      }
    }
    
    // Commit any remaining writes in the final batch
    if (batchCount > 0) {
       await batch.commit();
     }
    
    console.log(`✅ Success! Migrated ${migratedCount} records to current active Firestore.`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully synchronized ${migratedCount} listings from main DB to local environment! Priority flags restored.`,
      processed: migratedCount
    });
    
  } catch (err: any) {
    console.error('🚨 Cloud Data Sync FAILED:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
