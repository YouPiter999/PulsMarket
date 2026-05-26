import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const db = getFirestoreDb();
    const data = await request.json();

    if (!data.slug || !data.title || !data.content) {
      return NextResponse.json({ error: 'Missing required fields (slug, title, content)' }, { status: 400 });
    }

    const docRef = db.collection('articles').doc(data.slug);
    const docSnap = await docRef.get();

    // Защита от перезаписи, если не хотим, хотя ИИ генерирует уникальные
    if (docSnap.exists && !data.forceUpdate) {
       return NextResponse.json({ error: 'Article with this slug already exists' }, { status: 409 });
    }

    const articleData = {
      title: data.title,
      slug: data.slug,
      content: data.content, // Markdown text
      coverImage: data.coverImage || "/promo_banner.webp",
      excerpt: data.excerpt || data.content.substring(0, 150) + "...",
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      author: data.author || "PulseMarket AI",
      views: 0,
      region: data.region || "general" // south-cyprus, north-cyprus, general
    };

    await docRef.set(articleData);

    return NextResponse.json({ success: true, slug: data.slug });
  } catch (error: any) {
    console.error('Error saving article:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    
    const db = getFirestoreDb();
    let query: any = db.collection('articles').orderBy('createdAt', 'desc');
    
    if (region && region !== 'all') {
      query = query.where('region', '==', region);
    }
    
    const snapshot = await query.limit(20).get();
    
    const articles = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    });

    return NextResponse.json({ articles });
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
