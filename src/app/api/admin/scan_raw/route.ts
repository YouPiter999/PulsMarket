import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = getFirestoreDb();
        const snapshot = await db.collection('listings').get();
        
        const sapphireItems = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() as any }))
            .filter(item => String(item.description || '').includes('Sapphire'));
            
        return NextResponse.json({
            total_listings: snapshot.size,
            matches: sapphireItems
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
