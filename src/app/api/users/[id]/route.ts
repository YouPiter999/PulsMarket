import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const awaitedParams = await params;
    const id = awaitedParams.id;

    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    const db = getFirestoreDb();
    const doc = await db.collection('users').doc(String(id)).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: { id: doc.id, ...doc.data() }
    });

  } catch (error: any) {
    console.error('GET User Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
