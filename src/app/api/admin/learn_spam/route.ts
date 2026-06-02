import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getFirestoreDb();
    // Возвращаем последние 100 записей спама для синхронизации со скрепером
    const snapshot = await db.collection('learned_spam').orderBy('createdAt', 'desc').limit(100).get();
    const spamRecords = snapshot.docs.map((doc: any) => doc.data());
    return NextResponse.json({ success: true, spam: spamRecords });
  } catch (error) {
    console.error('Learn Spam GET error:', error);
    return NextResponse.json({ success: false, spam: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getFirestoreDb();
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json({ success: false, message: 'Invalid or too short spam text' }, { status: 400 });
    }

    const cleanText = text.trim();

    // Проверим, нет ли уже такого текста в последних 100 записях, чтобы не плодить дубликаты
    const snapshot = await db.collection('learned_spam')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
      
    const exists = snapshot.docs.some(doc => doc.data().text === cleanText);
    
    if (exists) {
      return NextResponse.json({ success: true, message: 'Spam text already learned' });
    }

    const newSpamRule = {
      text: cleanText.substring(0, 700), // Ограничиваем длину текста
      createdAt: new Date().toISOString()
    };

    await db.collection('learned_spam').add(newSpamRule);
    console.log('🧠 Saved learned spam rule on website:', cleanText.substring(0, 60));

    return NextResponse.json({ success: true, message: 'Spam rule saved successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Learn Spam POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
