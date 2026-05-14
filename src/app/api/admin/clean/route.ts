import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const db = getFirestoreDb();
    const listingsRef = db.collection('listings');
    
    // Step 1: Clean Duplicates (existing logic)
    const snapshot = await listingsRef.orderBy('createdAt', 'desc').get();
    console.log(`Scanning total ${snapshot.size} items...`);
    
    const seenMessages = new Set<string>();
    let deletedDups = 0;
    let deletedBadNews = 0;
    let deletedOld = 0;
    
    const docs = snapshot.docs;
    
    for (const doc of docs) {
       const data = doc.data();
       const listingId = doc.id;
       
       // 🕒 AGE FILTER: Delete anything older than 9 days (Requirement)
       const createdAt = data.createdAt ? new Date(data.createdAt) : new Date(0);
       const now = new Date();
       const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
       if (diffDays > 9) {
           console.log(`🚨 Deleting Old Entry (>9 days): ${listingId}`);
           await doc.ref.delete();
           deletedOld++;
           continue;
       }

       // 🚨 NEW FILTER: Delete generic external "News" 
       // Only keep if is official source, otherwise purge existing bad news items
       if (data.category === 'Новости') {
          const username = (data.username || '').toLowerCase();
          
          // If news NOT from admin channel and NOT from direct user listing
          const isOfficial = username === 'tg_news_cyprus_north' || username.includes('admin');
          
          if (!isOfficial) {
              console.log(`🚨 Deleting Bad News Entry: ${listingId}`);
              await doc.ref.delete();
              deletedBadNews++;
              continue; // Skip to next doc
          }
       }

       // 🏷️ AUTO-REPAIR: Correctly categorize "Stuff/Clothing"
       const rawContentLower = ((data.title || '') + ' ' + (data.description || '')).toLowerCase();
       const stuffKeywords = ["шлеп", "обувь", "одежда", "кроссовк", "кеды", "вещи", "штаны", "футболк", "куртк"];
       const isStuff = stuffKeywords.some(kw => rawContentLower.includes(kw));
       
       const updates: any = {};
       
       // 🏷️ AUTO-REPAIR 1: Correctly categorize "Stuff/Clothing"
       if (isStuff && data.category !== "Вещи" && data.category !== "Новости") {
           console.log(`🏷️ Recategorizing item ${listingId} to 'Вещи'`);
           updates.category = "Вещи";
       }

       // 🏷️ AUTO-REPAIR 2: Correctly capture "Real Estate" (Even if missing 'аренда' but has '1+1' or 'резорт')
       const housingKeywords = ["квартир", "дом", "вилл", "аренд", "резорт", "комплекс", "1+1", "2+1", "3+1", "4+1"];
       const isHousing = housingKeywords.some(kw => rawContentLower.includes(kw));
       if (isHousing && !isStuff && data.category !== "Недвижимость" && data.category !== "Новости") {
           console.log(`🏠 Recategorizing item ${listingId} to 'Недвижимость'`);
           updates.category = "Недвижимость";
       }
       
       // 🧹 METADATA SCRUB: Remove fake housing meta (rooms) from NON-housing categories
       if ((isStuff || (updates.category && updates.category !== "Недвижимость") || (data.category && data.category !== "Недвижимость")) && data.metadata?.rooms) {
           console.log(`🧹 Stripping fake metadata from ${listingId}`);
           updates.metadata = { ...data.metadata };
           delete updates.metadata.rooms;
       }
       
       if (Object.keys(updates).length > 0) {
           await doc.ref.update(updates);
       }

        // 🚨 NEW ABSOLUTE FILTER: Wipe ANY non-news item missing valid contacts!
        if (data.category !== 'Новости') {
            const officialUsernames = [
              'adscyprus', 'autoncy', 'autopazar', 'bazaranetncy', 'carsrentcy', 'chatscyprusnorth', 'cyprlife',
              'cyprus_adaptacia', 'cyprus_house', 'cyprus_off', 'cyprus_topchat', 'cypruselectric', 'freelanc_rabota',
              'freelance_chat_birzha', 'frilancru', 'frilanser_vacansii', 'go5gorch', 'kibris_cyprus', 'kipr_chat',
              'kipr_nedvizhimost', 'kiprx', 'kvartiry_cyprus', 'moneyincyprus', 'nedvizhka_ciprus', 'nedvizhkancy',
              'news_cyprus_north', 'north_cypruschat', 'northcyprus_island', 'northcyprusbest', 'northcyprusok',
              'onerealestatecyprus', 'piterspbnedvizimost', 'poputkancy', 'presscodesupportru', 'realestate_cyprus_limassol',
              'realtycyprus1', 'russiansin_northcyprus', 'severniy_kipr', 'severnykipr', 'severnyy_kipr_chat',
              'sharabara2026', 'travellerpa', 'ukraincy_na_kipri', 'utfejvqjuzrlzdli', 'venta_cyprus',
              'bothelpg_bot', 'killspams'
            ];

            // Strip official channel promos and source group mentions to perform an honest check for actual individual contacts
            let cleanBody = ((data.title || '') + ' ' + (data.description || '')).toLowerCase();
            officialUsernames.forEach(username => {
                const regex1 = new RegExp(`@${username}`, 'g');
                const regex2 = new RegExp(`t.me\\/${username}`, 'g');
                cleanBody = cleanBody.replace(regex1, '').replace(regex2, '');
            });

            const hasMention = cleanBody.includes('@') || cleanBody.includes('t.me/');
            // Detect contiguous sequences of digits (at least 7) that look like actual phones!
            const hasPhone = /\+?\d{7,}/.test(cleanBody.replace(/\s+/g, ''));
            
            // 🔥 SERGEY'S MANDATORY RULE: If seller has a public profile username, we MUST publish and NEVER delete (even without text contacts!)
            const rawUser = String(data.username || '').toLowerCase().replace('tg_', '');
            const hasProfile = rawUser && 
                               !officialUsernames.includes(rawUser) && 
                               !/^\d+$/.test(rawUser);
           
           if (!hasMention && !hasPhone && !hasProfile) {
               console.log(`🚨 Deleting Item Missing Contacts: ${listingId}`);
               await doc.ref.delete();
               continue; // Done!
           }
       }

       // 📸 ADDITIONAL MANDATORY PHOTO FILTER FOR RENTALS
       const rawBodyLower = ((data.title || '') + ' ' + (data.description || '')).toLowerCase();
       const blockKeywords = ['сдам', 'аренда', 'rent', 'продам', 'продажа', 'продается', 'продаётся', 'sale'];
       const needsPhoto = blockKeywords.some(kw => rawBodyLower.includes(kw));
       if (needsPhoto && !data.image_url) {
           console.log(`🚨 Deleting Rental/Sale Lacking Photo: ${listingId}`);
           await doc.ref.delete();
           continue; // Fully skip rest of processing!
       }

       // Standard Deduplication for remaining items
       const rawText = (data.title || '') + ' ' + (data.description || '');
       const fingerprint = rawText.toLowerCase().replace(/[^a-zа-я0-9]/gi, '').substring(0, 500);
       const extId = data.external_id ? String(data.external_id) : null;
       
       let isDup = false;
       if (fingerprint && fingerprint.length > 10 && seenMessages.has(fingerprint)) isDup = true;
       if (extId && seenMessages.has(`ID_${extId}`)) isDup = true;
       if (data.image_url && seenMessages.has(`IMG_${data.image_url}`)) isDup = true;
       
       if (isDup) {
          console.log(`🗑️ Deleting Duplicate: ${listingId}`);
          await doc.ref.delete();
          deletedDups++;
       } else {
          if (fingerprint) seenMessages.add(fingerprint);
          if (extId) seenMessages.add(`ID_${extId}`);
          if (data.image_url) seenMessages.add(`IMG_${data.image_url}`);
       }
    }
        return NextResponse.json({
        success: true,
        scanned: snapshot.size,
        deleted_old: deletedOld,
        deleted_duplicates: deletedDups,
        deleted_unauthorized_news: deletedBadNews,
        message: `Sanitization Success! Removed ${deletedOld} old entries (>9d), ${deletedBadNews} bad news, and ${deletedDups} duplicates.`
     });
    
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing ?id= parameter' }, { status: 400 });
    }
    const db = getFirestoreDb();
    await db.collection('listings').doc(id).delete();
    return NextResponse.json({ success: true, message: `Deleted listing ${id}` });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
