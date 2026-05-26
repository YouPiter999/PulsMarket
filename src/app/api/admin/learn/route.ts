import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getFirestoreDb();
    const snapshot = await db.collection('learned_rules').orderBy('createdAt', 'desc').limit(20).get();
    const rules = snapshot.docs.map(doc => doc.data());
    return NextResponse.json({ success: true, rules });
  } catch (error) {
    console.error('Learn API error:', error);
    return NextResponse.json({ success: false, rules: [] }, { status: 500 });
  }
}
