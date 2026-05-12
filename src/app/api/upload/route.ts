import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert File to standard Buffer/Blob for the fetch relay
    const bytes = await file.arrayBuffer();
    const blob = new Blob([bytes], { type: file.type });

    // Create payload for Catbox EXACTLY like the Python script
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
      return NextResponse.json({ error: 'Catbox rejected file', detail: trimmed }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Upload failed internal server error' }, { status: 500 });
  }
}
