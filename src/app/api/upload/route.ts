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

    let uploaded = false;
    let publicUrl = "";
    const uniqueName = `listings/${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${file.name || 'upload.jpg'}`;

    // 1. Try Firebase Storage (Primary - Stable & Self-hosted)
    try {
      const storage = getStorage();
      
      // Try default bucket first
      try {
        const bucket = storage.bucket();
        const bucketFile = bucket.file(uniqueName);
        await bucketFile.save(buffer, {
          metadata: {
            contentType: file.type || 'image/jpeg',
            metadata: {
              firebaseStorageDownloadTokens: Math.random().toString(36).substring(2, 15) // token for compatibility
            }
          }
        });
        try { await bucketFile.makePublic(); } catch (e) {}
        publicUrl = `https://storage.googleapis.com/${bucket.name}/${bucketFile.name}`;
        uploaded = true;
        console.log('Successfully uploaded to Default Firebase Storage:', publicUrl);
      } catch (e: any) {
        console.warn(`Default bucket failed: ${e.message}`);
      }

      // Try .firebasestorage.app bucket name
      if (!uploaded) {
        try {
          const bucket = storage.bucket('pulsemarket-group-app.firebasestorage.app');
          const bucketFile = bucket.file(uniqueName);
          await bucketFile.save(buffer, {
            metadata: {
              contentType: file.type || 'image/jpeg',
              metadata: {
                firebaseStorageDownloadTokens: Math.random().toString(36).substring(2, 15) // token for compatibility
              }
            }
          });
          try { await bucketFile.makePublic(); } catch (e) {}
          publicUrl = `https://storage.googleapis.com/${bucket.name}/${bucketFile.name}`;
          uploaded = true;
          console.log('Successfully uploaded to firebasestorage.app Storage:', publicUrl);
        } catch (e: any) {
          console.warn(`firebasestorage.app bucket failed: ${e.message}`);
        }
      }

      // Try .appspot.com bucket name
      if (!uploaded) {
        try {
          const bucket = storage.bucket('pulsemarket-group-app.appspot.com');
          const bucketFile = bucket.file(uniqueName);
          await bucketFile.save(buffer, {
            metadata: {
              contentType: file.type || 'image/jpeg',
              metadata: {
                firebaseStorageDownloadTokens: Math.random().toString(36).substring(2, 15) // token for compatibility
              }
            }
          });
          try { await bucketFile.makePublic(); } catch (e) {}
          publicUrl = `https://storage.googleapis.com/${bucket.name}/${bucketFile.name}`;
          uploaded = true;
          console.log('Successfully uploaded to appspot.com Storage:', publicUrl);
        } catch (e: any) {
          console.warn(`appspot.com bucket failed: ${e.message}`);
          throw new Error(`All GCS buckets failed: ${e.message}`);
        }
      }
    } catch (storageError: any) {
      console.error('Firebase Storage failed, trying ImgBB:', storageError.message);
    }

    if (uploaded) {
      return NextResponse.json({
        success: true,
        url: publicUrl
      });
    }

    // 2. Fallback to ImgBB (High compatibility uploader)
    const base64Str = buffer.toString('base64');
    const imgbbKeys = [
      'e53d3573d4e462b9048467002db84912',
      'ff26a742456c252d8becf571b3faa7da' // Alternate key found in scraper
    ];

    for (const key of imgbbKeys) {
      try {
        const imgbbForm = new FormData();
        imgbbForm.append('key', key);
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
        console.warn(`ImgBB key ${key} failed:`, resData?.error?.message || JSON.stringify(resData));
      } catch (imgbbError: any) {
        console.error(`ImgBB key ${key} failed with error:`, imgbbError.message);
      }
    }

    // 3. Fallback to Imagebin (keyless fallback - stable)
    try {
      const blob = new Blob([bytes], { type: file.type });
      const imagebinForm = new FormData();
      imagebinForm.append('file', blob, file.name || 'upload.jpg');

      const imagebinResponse = await fetch('https://imagebin.ca/upload.php', {
        method: 'POST',
        body: imagebinForm
      });

      const imagebinText = await imagebinResponse.text();
      const lines = imagebinText.split('\n');
      const urlLine = lines.find(line => line.startsWith('url:'));
      if (urlLine) {
        const imagebinUrl = urlLine.substring(4).trim();
        console.log('Successfully uploaded to Imagebin:', imagebinUrl);
        return NextResponse.json({
          success: true,
          url: imagebinUrl
        });
      }
      console.warn('Imagebin upload fallback failed:', imagebinText);
    } catch (imagebinError: any) {
      console.error('Imagebin upload fallback error:', imagebinError.message);
    }

    // 4. Fallback to Catbox (Relayed from server side to bypass VPS IP blocks)
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
      return NextResponse.json({ error: 'Catbox, Imagebin and Firebase Storage both failed', detail: trimmed }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Upload failed internal server error' }, { status: 500 });
  }
}
