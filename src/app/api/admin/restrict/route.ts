import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export async function GET() {
    try {
        const db = getFirestoreDb();
        const snapshot = await db.collection('restricted_usernames').get();
        const usernames = snapshot.docs.map((doc: any) => doc.id.toLowerCase());
        return NextResponse.json({ success: true, usernames });
    } catch (error: any) {
        console.error('RESTRICT GET error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { username } = await request.json();
        if (!username) {
            return NextResponse.json({ success: false, message: 'Username is required' }, { status: 400 });
        }
        
        const cleanUsername = username.replace('@', '').trim().toLowerCase();
        if (!cleanUsername) {
            return NextResponse.json({ success: false, message: 'Invalid username' }, { status: 400 });
        }

        const db = getFirestoreDb();
        await db.collection('restricted_usernames').doc(cleanUsername).set({
            restrictedAt: new Date().toISOString()
        });

        console.log(`💎 Dynamically restricted username: @${cleanUsername}`);
        return NextResponse.json({ success: true, message: `Restricted @${cleanUsername}` });
    } catch (error: any) {
        console.error('RESTRICT POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        if (!username) {
            return NextResponse.json({ success: false, message: 'Username is required' }, { status: 400 });
        }

        const cleanUsername = username.replace('@', '').trim().toLowerCase();
        const db = getFirestoreDb();
        await db.collection('restricted_usernames').doc(cleanUsername).delete();

        console.log(`🔓 Unrestricted username: @${cleanUsername}`);
        return NextResponse.json({ success: true, message: `Unrestricted @${cleanUsername}` });
    } catch (error: any) {
        console.error('RESTRICT DELETE error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
