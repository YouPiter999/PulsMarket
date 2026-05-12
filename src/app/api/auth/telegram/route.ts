import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const authData = await request.json();
    const { hash, ...fields } = authData;

    if (!hash) {
      return NextResponse.json({ success: false, error: 'Missing signature' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured on the server');
    }

    // 1. Construct the data-check-string
    // Filter and sort keys alphabetically
    const dataCheckArr = Object.keys(fields)
      .sort()
      .map(key => `${key}=${fields[key]}`);
    
    const dataCheckString = dataCheckArr.join('\n');

    // 2. Compute Secret Key: SHA256 of Bot Token
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    // 3. Compute HMAC-SHA256 of the data check string
    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    // 4. Validate
    if (hmac !== hash) {
      console.warn('Invalid login attempt:', { expected: hmac, received: hash });
      return NextResponse.json({ success: false, error: 'Invalid authentication signature' }, { status: 401 });
    }

    // Validated! Now update/create user in Firestore
    const db = getFirestoreDb();
    const userIdStr = String(authData.id);
    const userRef = db.collection('users').doc(userIdStr);
    const userSnap = await userRef.get();

    const now = new Date().toISOString();

    let userData;
    if (!userSnap.exists) {
      // Create new Pulse ID profile
      userData = {
        telegram_id: authData.id,
        username: authData.username || null,
        first_name: authData.first_name || null,
        last_name: authData.last_name || null,
        photo_url: authData.photo_url || null,
        language: 'ru',
        role: 'expat',
        trust_score: 50,
        verified_level: 0,
        created_at: now,
        updated_at: now
      };
      await userRef.set(userData);
    } else {
      // Update existing user (keep basic static stats but update mutable info)
      const current = userSnap.data() || {};
      userData = {
        ...current,
        username: authData.username || current.username,
        first_name: authData.first_name || current.first_name,
        last_name: authData.last_name || current.last_name,
        photo_url: authData.photo_url || current.photo_url,
        updated_at: now
      };
      await userRef.update(userData);
    }

    // In a production app, we should also issue a signed JWT / Set an HttpOnly Cookie here!
    // For MVP simplicity we return the verified payload.
    
    return NextResponse.json({
      success: true,
      message: 'Authenticated successfully',
      user: userData
    });

  } catch (error: any) {
    console.error('Auth Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
