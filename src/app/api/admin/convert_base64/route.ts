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

          const mimeType = match[1];
          const base64Data = match[2];
          let publicUrl: string | null = null;

          // 1. PRIMARY: Upload to ImgBB (direct base64 upload, 10s timeout per project rules)
          try {
            const imgbbForm = new FormData();
            imgbbForm.append('key', 'e53d3573d4e462b9048467002db84912');
            imgbbForm.append('image', base64Data);

            const imgbbController = new AbortController();
            const imgbbTimeout = setTimeout(() => imgbbController.abort(), 10000);
            const response = await fetch('https://api.imgbb.com/1/upload', {
              method: 'POST',
              body: imgbbForm,
              signal: imgbbController.signal
            });
            clearTimeout(imgbbTimeout);

            const resData = await response.json();
            if (response.status === 200 && resData?.data?.url) {
              publicUrl = resData.data.url as string;
            } else {
              const errDetail = resData?.error?.message || JSON.stringify(resData);
              console.warn(`ImgBB failed for ${doc.id}, falling back to Catbox: ${errDetail}`);
            }
          } catch (imgbbErr: any) {
            console.warn(`ImgBB error for ${doc.id}, falling back to Catbox:`, imgbbErr?.message || imgbbErr);
          }

          // 2. FALLBACK: Catbox.moe (no API key, no rate limit) per mandatory cascade rule
          if (!publicUrl) {
            const buffer = Buffer.from(base64Data, 'base64');
            const ext = (mimeType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
            const blob = new Blob([buffer], { type: mimeType });
            const catboxForm = new FormData();
            catboxForm.append('reqtype', 'fileupload');
            catboxForm.append('fileToUpload', blob, `image.${ext}`);

            const catboxController = new AbortController();
            const catboxTimeout = setTimeout(() => catboxController.abort(), 20000);
            const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
              method: 'POST',
              body: catboxForm,
              signal: catboxController.signal
            });
            clearTimeout(catboxTimeout);

            const catboxText = (await catboxResponse.text()).trim();
            if (catboxResponse.status === 200 && catboxText.startsWith('https://')) {
              publicUrl = catboxText;
              console.log(`✅ Converted base64 -> Catbox URL for ${doc.id}: ${publicUrl}`);
            } else {
              throw new Error(`Both ImgBB and Catbox failed. Catbox said: ${catboxText.substring(0, 120)}`);
            }
          }

          // Update Firestore with the permanent hosted URL
          await doc.ref.update({
            image_url: publicUrl,
            updatedAt: new Date().toISOString()
          });
          processed++;
        } catch (err: any) {
          console.error(`Failed to convert image for doc ${doc.id}:`, err);
          failed++;
          failuresList.push({ id: doc.id, title: data.title, error: err.message });
        }
      } else {
        skipped++;
      }
    }

    // ---- SECOND PASS: re-host listings whose photo was stashed in
    // pending_image_b64 on ingest because every image host was down at the time.
    // Once a host is reachable again this promotes the stashed photo back into
    // image_url and clears the stash. Keeps the same time budget.
    let pendingProcessed = 0;
    let pendingFailed = 0;
    let pendingRemaining = 0;
    if ((Date.now() - startTime) < 25000) {
      const pendingSnap = await db.collection('listings')
        .where('pending_image_b64', '>=', 'data:image/')
        .where('pending_image_b64', '<=', 'data:image/\uf8ff')
        .limit(batchLimit + 10)
        .get();
      for (const doc of pendingSnap.docs) {
        if ((Date.now() - startTime) > 25000 || pendingProcessed >= batchLimit) {
          pendingRemaining++;
          continue;
        }
        const data = doc.data();
        const pending = data.pending_image_b64 || '';
        const match = pending.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
        if (!match) continue;
        const mimeType = match[1];
        const base64Data = match[2];
        let publicUrl: string | null = null;
        try {
          // ImgBB (both keys)
          for (const key of ['e53d3573d4e462b9048467002db84912', 'ff26a742456c252d8becf571b3faa7da']) {
            if (publicUrl) break;
            try {
              const f = new FormData();
              f.append('key', key);
              f.append('image', base64Data);
              const c = new AbortController();
              const t = setTimeout(() => c.abort(), 10000);
              const r = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: f, signal: c.signal });
              clearTimeout(t);
              const rd = await r.json();
              if (r.status === 200 && rd?.data?.url) publicUrl = rd.data.url as string;
            } catch (_) { /* try next */ }
          }
          // Catbox fallback
          if (!publicUrl) {
            const buffer = Buffer.from(base64Data, 'base64');
            const ext = (mimeType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
            const blob = new Blob([buffer], { type: mimeType });
            const cf = new FormData();
            cf.append('reqtype', 'fileupload');
            cf.append('fileToUpload', blob, `image.${ext}`);
            const cc = new AbortController();
            const ct = setTimeout(() => cc.abort(), 20000);
            const cr = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: cf, signal: cc.signal });
            clearTimeout(ct);
            const txt = (await cr.text()).trim();
            if (cr.status === 200 && txt.startsWith('https://')) publicUrl = txt;
          }
          if (publicUrl) {
            await doc.ref.update({
              image_url: publicUrl,
              pending_image_b64: (await import('firebase-admin/firestore')).FieldValue.delete(),
              updatedAt: new Date().toISOString()
            });
            pendingProcessed++;
          } else {
            pendingFailed++;
            failuresList.push({ id: doc.id, title: data.title, error: 'All hosts failed (pending re-host)' });
          }
        } catch (err: any) {
          pendingFailed++;
          failuresList.push({ id: doc.id, title: data.title, error: 'pending: ' + (err?.message || err) });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      skipped,
      failed,
      remaining_base64: remainingBase64,
      pending_processed: pendingProcessed,
      pending_failed: pendingFailed,
      pending_remaining: pendingRemaining,
      failures: failuresList
    });

  } catch (error: any) {
    console.error("Conversion API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
