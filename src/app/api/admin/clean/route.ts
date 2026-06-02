import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';
import { getStorage } from 'firebase-admin/storage';
import { getCategoryNuclear } from '@/lib/categoryClassifier';

export const dynamic = 'force-dynamic';

function cleanText(text: string): string {
    if (!text) return "";
    // Remove source names and domains
    let cleaned = text;
    cleaned = cleaned.replace(/\b(?:kktcarabam|101evler|bazaraki)(?:\.com)?\b/gi, '');
    cleaned = cleaned.replace(/kktcarabam\.com|101evler\.com|bazaraki\.com/gi, '');
    cleaned = cleaned.replace(/kktcarabam|101evler|bazaraki/gi, '');
    // Remove extra separators and spaces
    cleaned = cleaned.replace(/\s*\|\s*/g, ' ');
    cleaned = cleaned.replace(/\s*-\s*/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ');
    return cleaned.trim();
}

export async function GET() {
    try {
        const db = getFirestoreDb();
        console.log("🧹 STARTING SYSTEM HYGIENE: Full Category Re-Indexing...");
        const snapshot = await db.collection('listings').orderBy('createdAt', 'desc').get();
        
        let scanned = 0;
        let deletedOld = 0;
        let deletedDuplicates = 0;
        let deletedBadNews = 0;
        let deletedSpamPrices = 0;
        let b64Attempted = 0;
        let b64Succeeded = 0;
        const b64Errors: string[] = [];
        
        let gcsAvailable = true;
        let imgbb1Available = true;
        let imgbb2Available = true;
        
        const now = new Date();
        const seenExternalIds = new Set<string>();        for (const doc of snapshot.docs) {
            const data = doc.data();
            const listingId = doc.id;
            
            // 0. CLEAN SPAM & DROP EMPTY LISTINGS
            const title = data.title || "";
            const description = data.description || "";
            const imageUrl = data.image_url || "";
            const updates: any = {};

            // 0.1 CONVERT BASE64 IMAGES TO STORAGE URLS
            let finalImageUrl = imageUrl;
            if (imageUrl && imageUrl.startsWith('data:image')) {
                b64Attempted++;
                
                // Limit processing to 15 base64 conversions per run to avoid serverless timeouts
                if (b64Succeeded + b64Errors.length < 15) {
                    try {
                        console.log(`🖼️ Converting Base64 image for listing ${listingId}...`);
                        const matches = imageUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-+.]+);base64,([\s\S]*)$/);
                        if (matches && matches.length === 3) {
                            const contentType = matches[1];
                            const base64Data = matches[2];
                            const buffer = Buffer.from(base64Data, 'base64');
                            
                            let uploaded = false;
                            let publicUrl = "";
                            const uniqueName = `listings/migrated_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;

                            // 1. Try Firebase Storage (with multiple bucket fallbacks)
                            if (gcsAvailable) {
                                try {
                                    const storage = getStorage();
                                    
                                    // Try default bucket first
                                    try {
                                        const bucket = storage.bucket();
                                        const bucketFile = bucket.file(uniqueName);
                                        await bucketFile.save(buffer, {
                                            metadata: {
                                                contentType: contentType || 'image/jpeg',
                                                metadata: {
                                                    firebaseStorageDownloadTokens: Math.random().toString(36).substring(2, 15)
                                                }
                                            }
                                        });
                                        try { await bucketFile.makePublic(); } catch(e){}
                                        publicUrl = `https://storage.googleapis.com/${bucket.name}/${bucketFile.name}`;
                                        uploaded = true;
                                        console.log(`✅ Converted Base64 to Default Storage URL: ${publicUrl}`);
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
                                                    contentType: contentType || 'image/jpeg',
                                                    metadata: {
                                                        firebaseStorageDownloadTokens: Math.random().toString(36).substring(2, 15)
                                                    }
                                                }
                                            });
                                            try { await bucketFile.makePublic(); } catch(e){}
                                            publicUrl = `https://storage.googleapis.com/${bucket.name}/${bucketFile.name}`;
                                            uploaded = true;
                                            console.log(`✅ Converted Base64 to firebasestorage.app Storage URL: ${publicUrl}`);
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
                                                    contentType: contentType || 'image/jpeg',
                                                    metadata: {
                                                        firebaseStorageDownloadTokens: Math.random().toString(36).substring(2, 15)
                                                    }
                                                }
                                            });
                                            try { await bucketFile.makePublic(); } catch(e){}
                                            publicUrl = `https://storage.googleapis.com/${bucket.name}/${bucketFile.name}`;
                                            uploaded = true;
                                            console.log(`✅ Converted Base64 to appspot.com Storage URL: ${publicUrl}`);
                                        } catch (e: any) {
                                            console.warn(`appspot.com bucket failed: ${e.message}`);
                                            throw new Error(`All GCS buckets failed: ${e.message}`);
                                        }
                                    }
                                } catch (storageErr: any) {
                                    console.warn(`⚠️ Firebase Storage failed, disabling GCS for subsequent listings. Error:`, storageErr.message);
                                    gcsAvailable = false;
                                }
                            }

                            // 2. Try ImgBB fallback (multiple keys)
                            if (!uploaded) {
                                const base64Str = buffer.toString('base64');
                                
                                // Check first key
                                if (imgbb1Available) {
                                    try {
                                        const imgbbForm = new FormData();
                                        imgbbForm.append('key', 'e53d3573d4e462b9048467002db84912');
                                        imgbbForm.append('image', base64Str);

                                        const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
                                            method: 'POST',
                                            body: imgbbForm
                                        });

                                        const resData = await imgbbResponse.json();
                                        if (imgbbResponse.status === 200 && resData && resData.data && resData.data.url) {
                                            publicUrl = resData.data.url;
                                            uploaded = true;
                                            console.log(`✅ Converted Base64 to ImgBB URL (Fallback): ${publicUrl}`);
                                        } else {
                                            console.warn(`ImgBB key 1 failed:`, resData?.error?.message || JSON.stringify(resData));
                                            if (resData?.error?.message?.includes('limit') || imgbbResponse.status === 400 || imgbbResponse.status === 403) {
                                                imgbb1Available = false;
                                            }
                                        }
                                    } catch (imgbbErr: any) {
                                        console.warn(`ImgBB key 1 failed with network error:`, imgbbErr.message);
                                    }
                                }

                                // Check second key
                                if (!uploaded && imgbb2Available) {
                                    try {
                                        const imgbbForm = new FormData();
                                        imgbbForm.append('key', 'ff26a742456c252d8becf571b3faa7da');
                                        imgbbForm.append('image', base64Str);

                                        const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
                                            method: 'POST',
                                            body: imgbbForm
                                        });

                                        const resData = await imgbbResponse.json();
                                        if (imgbbResponse.status === 200 && resData && resData.data && resData.data.url) {
                                            publicUrl = resData.data.url;
                                            uploaded = true;
                                            console.log(`✅ Converted Base64 to ImgBB URL 2 (Fallback): ${publicUrl}`);
                                        } else {
                                            console.warn(`ImgBB key 2 failed:`, resData?.error?.message || JSON.stringify(resData));
                                            if (resData?.error?.message?.includes('limit') || imgbbResponse.status === 400 || imgbbResponse.status === 403) {
                                                imgbb2Available = false;
                                            }
                                        }
                                    } catch (imgbbErr: any) {
                                        console.warn(`ImgBB key 2 failed with network error:`, imgbbErr.message);
                                    }
                                }
                            }

                            // 3. Try Imagebin fallback (no keys, no rate limit)
                            if (!uploaded) {
                                try {
                                    const blob = new Blob([buffer], { type: contentType || 'image/jpeg' });
                                    const imagebinForm = new FormData();
                                    imagebinForm.append('file', blob, 'image.jpg');

                                    const imagebinResponse = await fetch('https://imagebin.ca/upload.php', {
                                        method: 'POST',
                                        body: imagebinForm
                                    });

                                    const imagebinText = await imagebinResponse.text();
                                    const lines = imagebinText.split('\n');
                                    const urlLine = lines.find(line => line.startsWith('url:'));
                                    if (urlLine) {
                                        publicUrl = urlLine.substring(4).trim();
                                        uploaded = true;
                                        console.log(`✅ Converted Base64 to Imagebin URL (Fallback): ${publicUrl}`);
                                    } else {
                                        throw new Error(`Imagebin upload failed: ${imagebinText}`);
                                    }
                                } catch (imagebinErr: any) {
                                    console.error(`Imagebin fallback failed:`, imagebinErr.message);
                                }
                            }

                            // 4. Try Catbox fallback (ultimate fallback - no keys, no rate limit)
                            if (!uploaded) {
                                try {
                                    const blob = new Blob([buffer], { type: contentType || 'image/jpeg' });
                                    const catboxForm = new FormData();
                                    catboxForm.append('reqtype', 'fileupload');
                                    catboxForm.append('fileToUpload', blob, 'image.jpg');

                                    const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
                                        method: 'POST',
                                        body: catboxForm
                                    });

                                    const catboxText = await catboxResponse.text();
                                    const trimmedUrl = catboxText.trim();
                                    if (trimmedUrl.startsWith('https://')) {
                                        publicUrl = trimmedUrl;
                                        uploaded = true;
                                        console.log(`✅ Converted Base64 to Catbox URL (Fallback): ${trimmedUrl}`);
                                    } else {
                                        throw new Error(`Catbox upload failed: ${trimmedUrl}`);
                                    }
                                } catch (catboxErr: any) {
                                    console.error(`Catbox fallback failed:`, catboxErr.message);
                                    throw new Error(`All upload strategies (Storage, ImgBB, Imagebin, Catbox) failed: ${catboxErr.message}`);
                                }
                            }

                            if (uploaded) {
                                updates.image_url = publicUrl;
                                finalImageUrl = publicUrl;
                                b64Succeeded++;
                            } else {
                                throw new Error('Upload logic bypassed without error but failed to resolve URL.');
                            }
                        } else {
                            b64Errors.push(`${listingId}: base64 matches pattern failed`);
                        }
                    } catch (b64Err: any) {
                        console.error(`❌ Failed to convert Base64 for listing ${listingId}:`, b64Err);
                        b64Errors.push(`${listingId}: ${b64Err.message || String(b64Err)}`);

                        // Fall back to a placeholder so we don't get stuck retrying invalid/corrupted base64 forever
                        console.warn(`⚠️ Setting fallback placeholder for listing ${listingId} due to failed upload of invalid/corrupted base64.`);
                        updates.image_url = '/promo_banner.webp';
                        finalImageUrl = '/promo_banner.webp';
                        b64Succeeded++;
                    }
                }
            }

            // If manually moderated, save image updates immediately and skip the rest of the hygiene checks
            if (data.manually_moderated === true) {
                if (Object.keys(updates).length > 0) {
                    updates.updatedAt = new Date().toISOString();
                    await doc.ref.update(updates);
                }
                continue;
            }

            scanned++;

            const hasNoPhoto = !finalImageUrl || finalImageUrl === "None" || finalImageUrl === "null" || finalImageUrl === "undefined" || finalImageUrl.includes("promo_banner") || finalImageUrl === "";
            
            let tempDesc = description.replace(/Автомобиль на KKTCArabam\./gi, '');
            tempDesc = tempDesc.replace(/Real estate listing from 101evler\./gi, '');
            tempDesc = tempDesc.replace(/Смотрите оригинал объявления на сайте: [^\s]+/gi, '');
            tempDesc = tempDesc.replace(/Контакты:[^\n]+/gi, '');
            tempDesc = tempDesc.trim();

            const hasNoText = !tempDesc || tempDesc.length < 10;

            if (hasNoPhoto && hasNoText) {
                console.log(`🗑️ Deleting empty listing ${listingId} (${title})`);
                await doc.ref.delete();
                deletedOld++;
                continue;
            }

            const cleanedTitle = cleanText(title);
            let cleanedDesc = description;
            cleanedDesc = cleanedDesc.replace(/Автомобиль на KKTCArabam\.\n?/gi, '');
            cleanedDesc = cleanedDesc.replace(/Real estate listing from 101evler\.\n?/gi, '');
            cleanedDesc = cleanedDesc.replace(/\n?Смотрите оригинал объявления на сайте: [^\s]+/gi, '');
            cleanedDesc = cleanText(cleanedDesc);

            if (cleanedTitle !== title) {
                updates.title = cleanedTitle;
            }
            if (cleanedDesc !== description) {
                updates.description = cleanedDesc;
            }

            // 1. DUPLICATE REMOVAL (ID-based, Title-based, and Description-based)
            const fingerprint = `${cleanedTitle.trim()}_${data.price}_${(data.location || '').trim()}_${(data.raw_text || '').substring(0, 200).trim()}`;
            
            // Content-based duplicate check by description + username (extremely robust for weekly reposts)
            const cleanDesc = description.toLowerCase().replace(/[^a-zа-я0-9]/g, '').trim();
            const descFingerprint = cleanDesc.length > 30 ? `${data.username || ''}_${cleanDesc.substring(0, 300)}` : null;

            const isDuplicate = (data.external_id && seenExternalIds.has(data.external_id)) || 
                                seenExternalIds.has(fingerprint) ||
                                (descFingerprint && seenExternalIds.has(descFingerprint));

            if (isDuplicate) {
                console.log(`🗑️ Deleting duplicate listing ${listingId} (${title}) by description/fingerprint`);
                await doc.ref.delete();
                deletedDuplicates++;
                continue;
            }
            
            if (data.external_id) seenExternalIds.add(data.external_id);
            seenExternalIds.add(fingerprint);
            if (descFingerprint) seenExternalIds.add(descFingerprint);

            // 2. STALE LISTING REMOVAL (> 9 days)
            let createdAt = now;
            if (data.createdAt) {
                if (typeof data.createdAt === 'string') {
                    createdAt = new Date(data.createdAt);
                } else if (data.createdAt.seconds) {
                    createdAt = new Date(data.createdAt.seconds * 1000);
                } else {
                    createdAt = new Date(data.createdAt);
                }
            }
            const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
            if (diffDays > 9 && data.category !== 'Новости') {
                await doc.ref.delete();
                deletedOld++;
                continue;
            }

            // 3. BAD NEWS PURGE & SPAM RECOVERY PURGE
            if (data.category === 'Новости') {
                const username = (data.username || '').toLowerCase();
                const isOfficial = username === 'tg_news_cyprus_north' || username.includes('admin') || String(data.source || '').toLowerCase().includes('news_cyprus_north');
                if (!isOfficial) {
                    await doc.ref.delete();
                    deletedBadNews++;
                    continue;
                }
            }

            if (String(data.source || '').includes('Recovery') || String(data.external_id || '').includes('FORCE_SYNC')) {
                await doc.ref.delete();
                deletedOld++; // Just reuse this counter for now
                continue;
            }

            // 4. ROBUST CATEGORY CLASSIFICATION
            const targetCategory = getCategoryNuclear(data.title || '', data.description || '', data.category);

            if (targetCategory !== data.category) {
                console.log(`🔥 FIX [${listingId}]: ${data.category} -> ${targetCategory}`);
                updates.category = targetCategory;
            }

            // 4.5. Delete listings with spam price 0 or 1 for commercial goods and services
            const isNewsOrDemandClean = targetCategory === 'Новости' || targetCategory === '🔍 Спрос';
            const priceValClean = data.price !== undefined && data.price !== null ? Number(String(data.price).replace(/[^0-9.]/g, '')) : NaN;
            if (!isNewsOrDemandClean && !isNaN(priceValClean) && (priceValClean === 0 || priceValClean === 1)) {
                console.log(`🗑️ Deleting listing ${listingId} (${title}) due to spam price ${priceValClean} in category ${targetCategory}`);
                await doc.ref.delete();
                deletedSpamPrices++;
                continue;
            }

            const rawContentLower = ((data.title || '') + ' ' + (data.description || '')).toLowerCase();

            // Location Repair
            if (!data.location || data.location === "Не указана" || data.location === "Е" || data.location === "е") {
                const cities = ["Лимасол", "Пафос", "Ларнака", "Никосия", "Кирения", "Фамагуста", "Искеле"];
                for (const city of cities) {
                    if (rawContentLower.includes(city.toLowerCase())) {
                        updates.location = city;
                        break;
                    }
                }
                if (!updates.location && (data.location === "Е" || data.location === "е")) {
                    updates.location = "Лимасол";
                }
            }

            // Room Metadata
            if (targetCategory === "Недвижимость") {
                const roomsMatch = rawContentLower.match(/\b(\d\+\d)\b/);
                if (roomsMatch && (!data.metadata || data.metadata.rooms !== roomsMatch[1])) {
                    updates.metadata = { ...(data.metadata || {}), rooms: roomsMatch[1] };
                }
            }

            if (Object.keys(updates).length > 0) {
                updates.updatedAt = new Date().toISOString();
                await doc.ref.update(updates);
            }
        }

        return NextResponse.json({
            success: true,
            scanned,
            deleted_old: deletedOld,
            deleted_duplicates: deletedDuplicates,
            deleted_unauthorized_news: deletedBadNews,
            deleted_spam_prices: deletedSpamPrices,
            b64_attempted: b64Attempted,
            b64_succeeded: b64Succeeded,
            b64_errors: b64Errors.slice(0, 100),
            message: "Sanitization Success!"
        });
    } catch (error: any) {
        console.error("Hygiene Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
