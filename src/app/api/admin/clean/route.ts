import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

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
        const snapshot = await db.collection('listings').get();
        
        let scanned = 0;
        let deletedOld = 0;
        let deletedDuplicates = 0;
        let deletedBadNews = 0;
        
        const now = new Date();
        const seenExternalIds = new Set<string>();

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const listingId = doc.id;
            
            if (data.manually_moderated === true) {
                continue;
            }
            
            scanned++;

            // 0. CLEAN SPAM & DROP EMPTY LISTINGS
            const title = data.title || "";
            const description = data.description || "";
            const imageUrl = data.image_url || "";

            const hasNoPhoto = !imageUrl || imageUrl === "None" || imageUrl === "null" || imageUrl === "undefined" || imageUrl.includes("promo_banner") || imageUrl === "";
            
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

            const updates: any = {};
            if (cleanedTitle !== title) {
                updates.title = cleanedTitle;
            }
            if (cleanedDesc !== description) {
                updates.description = cleanedDesc;
            }

            // 1. DUPLICATE REMOVAL (ID-based and Content-based)
            const fingerprint = `${cleanedTitle.trim()}_${data.price}_${(data.location || '').trim()}_${(data.raw_text || '').substring(0, 200).trim()}`;
            const isDuplicate = (data.external_id && seenExternalIds.has(data.external_id)) || seenExternalIds.has(fingerprint);

            if (isDuplicate) {
                await doc.ref.delete();
                deletedDuplicates++;
                continue;
            }
            
            if (data.external_id) seenExternalIds.add(data.external_id);
            seenExternalIds.add(fingerprint);

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
            const rawContentLower = ((data.title || '') + ' ' + (data.description || '')).toLowerCase();
            
            // 4.1 TRANSPORT SIGNALS (NUCLEAR VERSION)
            const transportBrands = ["bmw", "audi", "mercedes", "toyota", "nissan", "honda", "mazda", "ford", "vw", "kia", "hyundai", "tesla", "porsche", "мерседес", "lexus", "jeep", "range rover", "land rover"];
            const hasTransportBrand = transportBrands.some(brand => rawContentLower.includes(brand));
            
            const transportRegex = /автомобиль|машина|мотоцикл|скутер|автобус|джип|седан|хэтчбек|кроссовер|внедорожник/i;
            const carRentSignals = ["аренда авто", "прокат авто", "сниму авто", "аренда машин", "прокат машин", "rent a car", "car rent", "сутки", "посуточно", "аренда бмв", "аренда bmw"];
            
            const hasTransportWord = transportRegex.test(rawContentLower);
            const hasCarRentSignal = carRentSignals.some(s => rawContentLower.includes(s));
            const transportChannels = ["auto", "car", "pazar", "transport", "poputka", "авто"];
            const comesFromTransportChannel = transportChannels.some(ch => String(data.source || '').toLowerCase().includes(ch) || String(data.username || '').toLowerCase().includes(ch));
            
            const isTransport = (hasTransportWord || hasTransportBrand || hasCarRentSignal || comesFromTransportChannel) && !rawContentLower.includes("парковк");

            // 4.2 HOUSING SIGNALS
            const housingRoots = ["квартир", "дом", "вилл", "участ", "земл", "офис", "магазин", "пентхаус", "таунхаус", "студи", "апартамент", "спальн", "villa", "apartment", "studio", "flat", "office", "bedroom", "bathroom"];
            const strictHousingMarkers = ["1+1", "2+1", "3+1", "4+1", "0+1", "таунхаус", "пентхаус", "апартамент", "резорт", "квартира", "вилла", "дом", "участок под", "apartment", "villa", "studio", "bedroom"];
            const genericRentVerbs = ["аренда", "сдам", "сдаю", "сниму", "куплю", "продам"];

            const hasHousingKeyword = housingRoots.some(root => rawContentLower.includes(root));
            const hasStrictHousing = strictHousingMarkers.some(m => rawContentLower.includes(m.toLowerCase()));
            const hasRoomsPattern = /\b\d\+\d\b/.test(rawContentLower);
            const hasGenericVerb = genericRentVerbs.some(v => rawContentLower.includes(v));
            
            // Housing only if it's strictly about property
            const isHousing = (hasHousingKeyword || hasRoomsPattern) && (!isTransport || hasStrictHousing);

            // 4.3 OTHER CATEGORIES
            const isNewsSource = String(data.username || '').toLowerCase().includes('news_cyprus_north') || 
                                 String(data.source || '').toLowerCase().includes('news_cyprus_north') ||
                                 rawContentLower.includes("курс лиры") || rawContentLower.includes("прогноз погоды");

            const toyKeywords = ["игрушк", "lego", "лего", "пистолет", "nerf", "кукол", "мяч", "коляска", "самокат", "fortnite", "ps4", "ps5", "xbox", "game", "игр"];
            const isMisc = toyKeywords.some(kw => rawContentLower.includes(kw));

            const furnitureKeywords = ["диван", "шкаф", "стол", "стул", "кровать", "матрас", "кухня", "кресло", "тумба", "комод"];
            const isFurniture = furnitureKeywords.some(kw => rawContentLower.includes(kw));

            const electronicsKeywords = ["iphone", "ipad", "телефон", "ноутбук", "macbook", "телевизор", "смартфон", "airpods", "apple watch"];
            const isElectronics = electronicsKeywords.some(kw => rawContentLower.includes(kw)) || (/\b(пк|pc|тв|tv)\b/i.test(rawContentLower) && !rawContentLower.includes("room"));

            const jobKeywords = ["вакансия", "требуется", "работа", "ищу работу"];
            const isJob = jobKeywords.some(kw => rawContentLower.includes(kw));

            const servicesKeywords = ["услуги", "ремонт", "перевозка", "доставка", "массаж", "обучение", "клининг"];
            const isServices = servicesKeywords.some(kw => rawContentLower.includes(kw));

            let targetCategory = "Разное";
            if (isNewsSource) targetCategory = "Новости";
            else if (isTransport) targetCategory = "Транспорт"; 
            else if (isHousing) targetCategory = "Недвижимость";
            else if (isMisc) targetCategory = "Разное";
            else if (isJob) targetCategory = "Работа";
            else if (isFurniture) targetCategory = "Мебель";
            else if (isElectronics) targetCategory = "Электроника";
            else if (isServices) targetCategory = "Услуги";
            else if (rawContentLower.includes("платье") || rawContentLower.includes("одежда")) targetCategory = "Одежда";

            if (targetCategory !== data.category) {
                console.log(`🔥 FIX [${listingId}]: ${data.category} -> ${targetCategory}`);
                updates.category = targetCategory;
            }

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
            message: "Sanitization Success!"
        });
    } catch (error: any) {
        console.error("Hygiene Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
