import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = getFirestoreDb();
        const snapshot = await db.collection('listings').get();
        
        const allItems = snapshot.docs
            .map((doc: any) => ({ id: doc.id, ...doc.data() as any }));
            
        return NextResponse.json({
            total_listings: snapshot.size,
            matches: allItems
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
