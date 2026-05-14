import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';
import { broadcastStatus } from '../../../lib/networkDispatcher';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const db = getFirestoreDb();
    const data = await request.json();
    
    const isNews = data.is_news === true || data.category === 'Новости';
    const isTelegram = String(data.source || '').toLowerCase().includes('telegram');
    const bypassValidation = isNews || isTelegram;
    
    // Price validation
    const priceStr = String(data.price || '').replace(/[^0-9.]/g, '');
    const parsedPrice = parseFloat(priceStr);

    if (!bypassValidation && (!data.price || isNaN(parsedPrice) || parsedPrice <= 5)) {
        console.log('Listing rejected: Missing or invalid price:', data.title, data.price);
        return NextResponse.json({ 
          success: false, 
          message: 'Valid price is required (must be greater than 5)' 
        }, { status: 400 });
    }

    // Category-specific unrealistically low price check
    const category = data.category || '';
    if (!bypassValidation && category === 'Недвижимость' && parsedPrice < 100) {
        console.log('Real Estate listing rejected due to unrealistically low price:', data.title, data.price);
        return NextResponse.json({ 
          success: false, 
          message: 'Unrealistically low price for Real Estate (minimum is 100)' 
        }, { status: 400 });
    }

    if (!bypassValidation && category === 'Транспорт' && parsedPrice < 100) {
        console.log('Transport listing rejected due to unrealistically low price:', data.title, data.price);
        return NextResponse.json({ 
          success: false, 
          message: 'Unrealistically low price for Transport (minimum is 100)' 
        }, { status: 400 });
    }

    // Location validation (Must specify a specific city/region, not just generic country)
    const location = String(data.location || '').trim();
    const genericLocations = ['cyprus', 'кипр', 'северный кипр', 'north cyprus', 'turkey', 'турция', 'russia', 'россия', 'uae', 'оаэ'];
    
    if (!bypassValidation && (!location || location.length < 3 || genericLocations.includes(location.toLowerCase()))) {
        console.log('Listing rejected: Location is missing, too short, or too generic:', data.title, data.location);
        return NextResponse.json({ 
          success: false, 
          message: 'A specific city or region is required (cannot be empty or just a country name)' 
        }, { status: 400 });
    }

    // Read current data from Firestore to check duplicates (limit to recent 60 to cover large batches)
    const snapshot = await db.collection('listings').orderBy('createdAt', 'desc').limit(60).get();
    const listings = snapshot.docs.map(doc => doc.data());

    // 🛡️ IRON CLAD DUPLICATE PROTECTION 🛡️
    const isDuplicate = listings.some((l: any) => {
        // 1. Exact Title and Price Match
        const cleanTitle1 = l.title.toLowerCase().replace(/[^a-zа-я0-9]/g, '').trim();
        const cleanTitle2 = data.title.toLowerCase().replace(/[^a-zа-я0-9]/g, '').trim();
        const titlePriceMatch = (cleanTitle1 === cleanTitle2 && String(l.price) === String(data.price));
        
        // 2. EXACT IMAGE MATCH (Crucial for visual reposts!)
        const imageMatch = data.image_url && l.image_url && data.image_url === l.image_url;
        
        // 3. EXTERNAL ID MATCH
        const extIdMatch = data.external_id && l.external_id && String(data.external_id) === String(l.external_id);

        return titlePriceMatch || imageMatch || extIdMatch;
    });

    const sourceStr = String(data.source || '').toLowerCase();
    const originatesFromMainChannel = sourceStr.includes('northcyprus_island');

    if (isDuplicate) {
        if (!originatesFromMainChannel) {
            console.log('Duplicate listing rejected:', data.title);
            return NextResponse.json({ 
              success: false, 
              message: 'Duplicate listing detected' 
            }, { status: 409 });
        } else {
            // 🔥 SELF-HEALING DUPLICATE MERGE 🔥
            // If supreme channel overrides a duplicate, physically delete existing duplicates to prevent clutter
            const cleanTitleNew = data.title.toLowerCase().replace(/[^a-zа-я0-9]/g, '').trim();
            for (const doc of snapshot.docs) {
                const l = doc.data();
                const cleanTitleOld = (l.title || '').toLowerCase().replace(/[^a-zа-я0-9]/g, '').trim();
                if (cleanTitleOld === cleanTitleNew && String(l.price) === String(data.price)) {
                    console.log('🔥 Merging Supreme Duplicate: deleting existing instance', doc.id);
                    await doc.ref.delete(); 
                }
            }
        }
    }
    
    // 🛑 ABSOLUTE SAFETY GATE: Block listings WITHOUT contact info!
    if (data.category !== 'Новости') {
        const rawBody = ((data.title || '') + ' ' + (data.description || '')).toLowerCase();
        
        // 📸 PHOTO MANDATE FOR RENTALS: Rent items MUST have photos!
        const blockKeywords = ['сдам', 'аренда', 'rent', 'продам', 'продажа', 'продается', 'продаётся', 'sale'];
        const needsPhoto = blockKeywords.some(kw => rawBody.includes(kw));
        if (needsPhoto && !data.image_url) {
            console.warn('❌ INGRESS BLOCKED: Commercial listing (Rent/Sale) lacks required photography.', data.title);
            return NextResponse.json({ 
              success: false, 
              message: 'Rejected: Commercial listings (Rent/Sale) MUST include photos.' 
            }, { status: 400 });
        }

        const hasMention = rawBody.includes('@') || rawBody.includes('t.me/');
        
        // FIXED REGEX: Only count contiguous sequences of 7+ digits (phones), ignore sparse price digits!
        const hasPhone = /\+?\d{7,}/.test(rawBody.replace(/\s+/g, ''));

        // 🛡️ SUPER-UPGRADE: If the scraping engine successfully retrieved a verified USER profile username,
        // treat it as 100% VALID contact info, even if omitted from the raw text!
        const hasProfileUser = data.username && data.username.startsWith('tg_') && !data.username.includes('@');
        
        if (!hasMention && !hasPhone && !hasProfileUser) {
            console.warn('❌ INGRESS BLOCKED: Listing contains NO usable contact data (no mention, no contiguous phone string).', data.title);
            return NextResponse.json({ 
              success: false, 
              message: 'Rejected: No valid contact information found in listing text.' 
            }, { status: 400 });
        }
    }

    // Add timestamp and ID
    const docRef = db.collection('listings').doc();
    // Standardize with architecture specification defaults
    const newListing = {
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: data.status || 'active',
        verified_badge: data.verified_badge || 'none',
        type: data.type || 'goods', // Default fallback type
        ...data
    };
    
    await docRef.set(newListing);

    console.log('Saved listing to Firestore:', newListing);

    // BROADCAST LOGIC: Prevent infinite loops and silence migration floods.
    const isRecoveryBatch = sourceStr.includes('recovery') || sourceStr.includes('historical');
    
    // 🔥 RULE: Post to Main Telegram IF it didn't come from there, and isn't a batch restoration! 🔥
    if (!originatesFromMainChannel && !isRecoveryBatch) {
        // Non-blocking async notification to prevent slowing down web response
        broadcastStatus(newListing).catch(err => 
            console.error('Background TG notify failed:', err)
        );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Listing saved to cloud',
      data: newListing 
    }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to save listing' 
    }, { status: 400 });
  }
}

export async function GET() {
    try {
        const db = getFirestoreDb();
        const snapshot = await db.collection('listings').orderBy('createdAt', 'desc').limit(9000).get();
        const listings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return NextResponse.json(listings);
    } catch (error) {
        console.error('GET API Error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function DELETE() {
    try {
        const db = getFirestoreDb();
        const snapshot = await db.collection('listings').limit(50).get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return NextResponse.json({ success: true, message: 'Wiped recent listings successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to wipe' }, { status: 500 });
    }
}
