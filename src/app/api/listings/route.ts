// src/app/api/listings/route.ts
import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';
import { broadcastStatus } from '../../../lib/networkDispatcher';

export const dynamic = 'force-dynamic';

function getCategoryNuclear(title: string, description: string) {
  const text = (title + " " + description).toLowerCase();

  if (text.includes("новости")) return "Новости";

  const toyKeywords = ["игрушки", "игрушк", "кукла", "машинка", "конструктор", "lego", "лего", "пистолет", "бластер", "пазл", "мяч", "коляска", "самокат", "nerf", "фортнайт", "fortnite"];
  const jobKeywords = ["вакансия", "требуется", "работа", "ищу работу", "ищем сотрудника"];
  const furnitureKeywords = ["диван", "шкаф", "стол", "стул", "кровать", "матрас", "кухня", "комод", "тумба"];
  const vehicleBrands = ["bmw", "audi", "mercedes", "toyota", "nissan", "honda", "mazda", "ford", "vw", "kia", "hyundai", "tesla", "porsche", "мерседес"];

  const hasTransportBrand = vehicleBrands.some(brand => new RegExp(`\\b${brand}\\b`).test(text));
  const hasTransportGeneric = /\\bавто(?:мобил|бус|салон)?\\b|\\bавто\\b/.test(text);
  const hasCarWord = /\\bмашин[а-я]*\\b/.test(text);

  const housingRoots = ["квартир", "дом", "вилл", "аренд", "сдам", "сдаю", "сниму", "куплю", "продам", "участ", "земл", "офис", "магазин", "пентхаус", "таунхаус", "студи", "апартамент", "спальн", "villa", "apartment", "studio", "flat", "office", "bedroom", "bathroom"];
  const hasHousingKeyword = housingRoots.some(root => new RegExp(`\\b${root}[а-яa-z]*\\b`, 'i').test(text));
  const hasRoomsPattern = /\\b\\d\\+\\d\\b/.test(text);

  const isToy = toyKeywords.some(kw => text.includes(kw));
  const isFurniture = furnitureKeywords.some(kw => text.includes(kw));
  const isElec = ["iphone", "ipad", "ноутбук", "macbook", "телевизор", "смартфон", "пылесос"].some(kw => text.includes(kw)) || /\\b(pк|pc|тв|tv)\\b/i.test(text);

  const hasItemSignals = isToy || isFurniture || isElec || hasTransportBrand || (hasCarWord && !text.includes("парковк"));

  const strictHousingMarkers = ["1+1", "2+1", "3+1", "4+1", "0+1", "таунхаус", "пентхаус", "апартамент", "резорт", "villa", "apartment", "bedroom", "office"];
  const hasStrictHousing = strictHousingMarkers.some(kw => text.includes(kw.toLowerCase()));

  const isHousing = (hasHousingKeyword || hasRoomsPattern) && (!hasItemSignals || hasStrictHousing);
  if (isHousing) return "Недвижимость";
  if (isToy) return "Разное";
  if (hasTransportBrand || (hasCarWord && !text.includes("парковк")) || hasTransportGeneric) return "Транспорт";
  if (jobKeywords.some(kw => text.includes(kw))) return "Работа";
  if (isFurniture) return "Мебель";
  if (isElec) return "Электроника";
  if (["услуги", "ремонт", "перевозка", "доставка", "массаж", "обучение"].some(kw => text.includes(kw))) return "Услуги";
  return "Разное";
}

export async function POST(request: Request) {
  try {
    const db = getFirestoreDb();
    const data = await request.json();

    // ---- NEW VALIDATIONS ----
    // 1. Username must be present and visible.
    if (!data.username || typeof data.username !== 'string' || data.username.trim() === '') {
      return NextResponse.json({ success: false, message: 'Username must be provided and visible.' }, { status: 400 });
    }

    const hasPrice = data.price !== undefined && data.price !== null && Number(data.price) > 0;
    const hasImage = Boolean(data.image_url);
    const isPaidPublication = Boolean(data.paid) || (String(data.source || '').toLowerCase().includes('telegram') && Number(data.price) === 0);

    // Ensure a placeholder image for paid listings without one
    if (isPaidPublication && !hasImage) {
      data.image_url = '/promo_banner.webp';
    }

    // Regular validation for non‑paid listings
    if (!isPaidPublication && !hasPrice && !hasImage) {
      return NextResponse.json({ success: false, message: 'Listing must contain at least a price or a photo.' }, { status: 400 });
    }

    const restrictedUsers = ["alice12121223", "alexzander94", "ofeliana1", "elenacyprus234", "kamelot7171", "li1problem", "alexmoov"];
    const usernameClean = String(data.username || '').toLowerCase().replace(/^@/, '').replace(/^tg_/, '').trim();
    const contactClean = String(data.contact || '').toLowerCase().replace(/^@/, '').replace(/^tg_/, '').trim();

    if (restrictedUsers.includes(usernameClean) || restrictedUsers.includes(contactClean)) {
        console.warn(`🛑 WEBSITE SUBMISSION BLOCKED: Restricted user ${usernameClean || contactClean} attempted listing without Telegram Stars payment.`);
        return NextResponse.json({ success: false, message: 'Публикация для данного аккаунта возможна только после оплаты 99 звёзд в Telegram боте.' }, { status: 403 });
    }

    const isNews = data.is_news === true || data.category === 'Новости';
    const isTelegram = String(data.source || '').toLowerCase().includes('telegram');
    const bypassValidation = isNews || isTelegram || data.force_override_validation === true;

    const sourceStr = String(data.source || '').toLowerCase();
    const originatesFromMainChannel = sourceStr.includes('northcyprus_island');

    // ----- VALIDATION BLOCK START -----
    if (!isPaidPublication) {
      // Price validation
      const priceStr = String(data.price || '').replace(/[^0-9.]/g, '');
      const parsedPrice = parseFloat(priceStr);
      if (!bypassValidation && (!data.price || isNaN(parsedPrice) || parsedPrice <= 5)) {
          console.log('Listing rejected: Missing or invalid price:', data.title, data.price);
          return NextResponse.json({ success: false, message: 'Valid price is required (must be greater than 5)' }, { status: 400 });
      }

      // Category‑specific low‑price checks
      const category = data.category || '';
      if (!bypassValidation && category === 'Недвижимость' && parsedPrice < 100) {
          console.log('Real Estate listing rejected due to unrealistically low price:', data.title, data.price);
          return NextResponse.json({ success: false, message: 'Unrealistically low price for Real Estate (minimum is 100)' }, { status: 400 });
      }
      if (!bypassValidation && category === 'Транспорт' && parsedPrice < 100) {
          console.log('Transport listing rejected due to unrealistically low price:', data.title, data.price);
          return NextResponse.json({ success: false, message: 'Unrealistically low price for Transport (minimum is 100)' }, { status: 400 });
      }

      // Location validation
      const location = String(data.location || '').trim();
      const genericLocations = ['cyprus', 'кипр', 'северный кипр', 'north cyprus', 'turkey', 'турция', 'russia', 'россия', 'uae', 'оаэ'];
      if (!bypassValidation && (!location || location.length < 3 || genericLocations.includes(location.toLowerCase()))) {
          console.log('Listing rejected: Location is missing, too short, or too generic:', data.title, data.location);
          return NextResponse.json({ success: false, message: 'A specific city or region is required (cannot be empty or just a country name)' }, { status: 400 });
      }

      // Duplicate detection (last 60 entries)
      const snapshot = await db.collection('listings').orderBy('createdAt', 'desc').limit(60).get();
      const listings = snapshot.docs.map((doc: any) => doc.data());
      const isDuplicate = listings.some((l: any) => {
          const cleanTitle1 = String(l.title || '').toLowerCase().replace(/[^a-zа-я0-9]/g, '').trim();
          const cleanTitle2 = String(data.title || '').toLowerCase().replace(/[^a-zа-я0-9]/g, '').trim();
          const titlePriceMatch = (cleanTitle1 === cleanTitle2 && String(l.price) === String(data.price));
          const imageMatch = data.image_url && l.image_url && data.image_url === l.image_url;
          const extIdMatch = data.external_id && l.external_id && String(data.external_id) === String(l.external_id);
          return titlePriceMatch || imageMatch || extIdMatch;
      });

      if (isDuplicate) {
        if (!originatesFromMainChannel) {
            console.log('Duplicate listing rejected:', data.title);
            return NextResponse.json({ success: false, message: 'Duplicate listing detected' }, { status: 409 });
        } else {
            // Merge duplicates from supreme channel
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

      // Contact validation for non‑news listings
      if (data.category !== 'Новости') {
          const rawBody = ((data.title || '') + ' ' + (data.description || '')).toLowerCase();
          const blockKeywords = ['сдам', 'аренда', 'rent', 'продам', 'продажа', 'продается', 'продаётся', 'sale'];
          const needsPhoto = blockKeywords.some(kw => rawBody.includes(kw));
          if (needsPhoto && !data.image_url) {
              console.warn('❌ INGRESS BLOCKED: Commercial listing (Rent/Sale) lacks required photography.', data.title);
              return NextResponse.json({ success: false, message: 'Rejected: Commercial listings (Rent/Sale) MUST include photos.' }, { status: 400 });
          }
          const hasMention = rawBody.includes('@') || rawBody.includes('t.me/');
          const hasPhone = /\+?\d{7,}/.test(rawBody.replace(/\s+/g, ''));
          const hasProfileUser = data.username && data.username.startsWith('tg_') && !data.username.includes('@');
          if (!hasMention && !hasPhone && !hasProfileUser) {
              console.warn('❌ INGRESS BLOCKED: Listing contains NO usable contact data (no mention, no contiguous phone string).', data.title);
              return NextResponse.json({ success: false, message: 'Rejected: No valid contact information found in listing text.' }, { status: 400 });
          }
      }
    }
    // ----- VALIDATION BLOCK END -----

    // Add timestamp and ID
    const docRef = db.collection('listings').doc();
    const newListing = {
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: data.status || 'active',
        verified_badge: data.verified_badge || 'none',
        type: data.type || 'goods',
        ...data
    };

    await docRef.set(newListing);
    console.log('Saved listing to Firestore:', newListing);

    // Broadcast to Telegram if needed
    const isRecoveryBatch = sourceStr.includes('recovery') || sourceStr.includes('historical');
    if (!originatesFromMainChannel && !isRecoveryBatch) {
        broadcastStatus(newListing).catch(err => console.error('Background TG notify failed:', err));
    }

    return NextResponse.json({ success: true, message: 'Listing saved to cloud', data: newListing }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save listing' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const db = getFirestoreDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const doc = await db.collection('listings').doc(id).get();
      if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ id: doc.id, ...doc.data() });
    }
    const cursorId = searchParams.get('cursor');
    const limitStr = searchParams.get('limit') || '50';
    const limit = parseInt(limitStr, 10) || 50;
    const q = searchParams.get('q')?.toLowerCase() || '';

    let listings: any[] = [];
    let nextCursor: string | null = null;

    if (q) {
      // Fetch more items and filter in memory since Firebase has no full-text search
      const snapshot = await db.collection('listings').orderBy('createdAt', 'desc').limit(300).get();
      listings = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      listings = listings.filter((item: any) => {
         const text = ((item.title || '') + ' ' + (item.description || '') + ' ' + (item.location || '')).toLowerCase();
         return text.includes(q);
      });
    } else if (cursorId) {
      let query = db.collection('listings').orderBy('createdAt', 'desc').limit(limit);
      const cursorDoc = await db.collection('listings').doc(cursorId).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
      const snapshot = await query.get();
      listings = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      nextCursor = snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;
    } else {
      // First page / initial load without search: get both general and priority
      const [generalSnapshot, prioritySnapshot] = await Promise.all([
        db.collection('listings').orderBy('createdAt', 'desc').limit(limit).get(),
        db.collection('listings').where('is_priority', '==', true).limit(100).get()
      ]);

      const mergedDocs = new Map<string, any>();
      generalSnapshot.docs.forEach((doc: any) => mergedDocs.set(doc.id, { id: doc.id, ...doc.data() }));
      prioritySnapshot.docs.forEach((doc: any) => mergedDocs.set(doc.id, { id: doc.id, ...doc.data() }));

      listings = Array.from(mergedDocs.values());
      // Sort by createdAt descending
      listings.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      nextCursor = generalSnapshot.docs.length === limit ? generalSnapshot.docs[generalSnapshot.docs.length - 1].id : null;
    }

    // Return lightweight objects to optimize payload size
    listings = listings.map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      currency: item.currency,
      category: item.category,
      location: item.location,
      createdAt: item.createdAt,
      image_url: item.image_url,
      country: item.country,
      verified_badge: item.verified_badge,
      description: item.description ? (item.description.length > 150 ? item.description.substring(0, 150) + '...' : item.description) : '',
      type: item.type,
      is_priority: item.is_priority || false,
      source: item.source || '',
      username: item.username || ''
    }));
    
    return NextResponse.json({
      listings,
      nextCursor
    });
  } catch (error) {
    console.error('GET API Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const db = getFirestoreDb();
    if (id) {
      console.log(`🗑️ Deleting specific listing: ${id}`);
      await db.collection('listings').doc(id).delete();
      return NextResponse.json({ success: true, message: `Deleted listing ${id} successfully` });
    }
    const snapshot = await db.collection('listings').limit(50).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();
    return NextResponse.json({ success: true, message: 'Wiped recent listings successfully' });
  } catch (error) {
    console.error('DELETE API Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updates } = data;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Listing ID is required' }, { status: 400 });
    }
    const db = getFirestoreDb();
    console.log(`🔧 Updating listing ${id}:`, updates);
    const extraUpdates: any = { ...updates };
    if (updates.category) {
      extraUpdates.manually_moderated = true;
      try {
        const docSnapshot = await db.collection('listings').doc(id).get();
        if (docSnapshot.exists) {
          const oldData = docSnapshot.data();
          if (oldData?.category !== updates.category) {
            const textToLearn = ((oldData?.title || '') + ' ' + (oldData?.description || '')).trim();
            if (textToLearn.length > 20) {
              await db.collection('learned_rules').add({
                text: textToLearn.substring(0, 500),
                category: updates.category,
                createdAt: new Date().toISOString()
              });
              console.log('🧠 Saved learning rule for category:', updates.category);
            }
          }
        }
      } catch (e) {
        console.error('Failed to save learning rule:', e);
      }
    }
    await db.collection('listings').doc(id).update({ ...extraUpdates, updatedAt: new Date().toISOString() });
    return NextResponse.json({ success: true, message: 'Updated successfully' });
  } catch (error: any) {
    console.error('PATCH API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
