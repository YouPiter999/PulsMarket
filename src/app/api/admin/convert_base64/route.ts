import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  try {
    const db = getFirestoreDb();
    console.log("🚀 Starting Base64 to ImgBB conversion...");
    const batchLimit = 15;
    const snapshot = await db.collection('listings')
      .where('image_url', '>=', 'data:image/')
      .where('image_url', '<=', 'data:image/\uf8ff')
      .limit(batchLimit + 10)
      .get();
    
    let processed = 0;
    let failed = 0;
    let skipped = 0;
    let remainingBase64 = 0;
    const failuresList: any[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const imageUrl = data.image_url || '';

      if (imageUrl.startsWith('data:image/')) {
        if (processed >= batchLimit || (Date.now() - startTime) > 25000) {
          remainingBase64++;
          continue;
        }

        try {
          // Parse base64
          const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
          if (!match) {
            skipped++;
            continue;
          }

          const base64Data = match[2];

          // Upload to ImgBB (direct base64 upload)
          const imgbbForm = new FormData();
          imgbbForm.append('key', 'e53d3573d4e462b9048467002db84912');
          imgbbForm.append('image', base64Data);

          const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: imgbbForm
          });

          const resData = await response.json();

          if (response.status === 200 && resData && resData.data && resData.data.url) {
            const publicUrl = resData.data.url;
            // Update Firestore with the permanent ImgBB URL
            await doc.ref.update({
              image_url: publicUrl,
              updatedAt: new Date().toISOString()
            });
            processed++;
          } else {
            const errDetail = resData?.error?.message || JSON.stringify(resData);
            throw new Error(`ImgBB upload failed: ${errDetail}`);
          }
        } catch (err: any) {
          console.error(`Failed to convert image for doc ${doc.id}:`, err);
          failed++;
          failuresList.push({ id: doc.id, title: data.title, error: err.message });
        }
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      skipped,
      failed,
      remaining_base64: remainingBase64,
      failures: failuresList
    });

  } catch (error: any) {
    console.error("Conversion API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
