import { NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { getApps, initializeApp } from 'firebase-admin/app';

// Ensure Firebase Admin is initialized
const apps = getApps();
if (!apps.length) {
  initializeApp();
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Try Firebase Storage (Primary - Stable & Self-hosted)
    try {
      const storage = getStorage();
      const bucket = storage.bucket('pulsemarket-group-app.appspot.com');
      const uniqueName = `listings/${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${file.name || 'upload.jpg'}`;
      const bucketFile = bucket.file(uniqueName);

      await bucketFile.save(buffer, {
        metadata: {
          contentType: file.type || 'image/jpeg',
          metadata: {
            firebaseStorageDownloadTokens: Math.random().toString(36).substring(2, 15) // token for compatibility
          }
        }
      });

      // Make the file publicly accessible
      try {
        await bucketFile.makePublic();
      } catch (pubErr) {
        console.warn('Could not make file public, attempting signed URL or default public access:', pubErr);
      }

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${bucketFile.name}`;
      console.log('Successfully uploaded to Firebase Storage:', publicUrl);

      return NextResponse.json({
        success: true,
        url: publicUrl
      });
    } catch (storageError) {
      console.error('Firebase Storage failed, falling back to ImgBB:', storageError);
    }

    // 2. Fallback to ImgBB (High compatibility uploader)
    try {
      const base64Str = buffer.toString('base64');
      const imgbbForm = new FormData();
      imgbbForm.append('key', 'e53d3573d4e462b9048467002db84912');
      imgbbForm.append('image', base64Str);

      const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: imgbbForm
      });

      const resData = await imgbbResponse.json();
      if (imgbbResponse.status === 200 && resData && resData.data && resData.data.url) {
        console.log('Successfully uploaded to ImgBB:', resData.data.url);
        return NextResponse.json({
          success: true,
          url: resData.data.url
        });
      }
      console.warn('ImgBB upload fallback failed:', resData);
    } catch (imgbbError) {
      console.error('ImgBB upload fallback error:', imgbbError);
    }

    // 3. Fallback to Catbox (Relayed from server side to bypass VPS IP blocks)
    const blob = new Blob([bytes], { type: file.type });
    const catboxForm = new FormData();
    catboxForm.append('reqtype', 'fileupload');
    catboxForm.append('fileToUpload', blob, file.name || 'upload.jpg');

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: catboxForm
    });

    const text = await response.text();
    const trimmed = text.trim();

    if (trimmed.startsWith('https://')) {
      return NextResponse.json({
        success: true,
        url: trimmed
      });
    } else {
      return NextResponse.json({ error: 'Catbox and Firebase Storage both failed', detail: trimmed }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Upload failed internal server error' }, { status: 500 });
  }
}
