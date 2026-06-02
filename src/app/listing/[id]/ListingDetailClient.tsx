'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { translateListingText } from '../../../utils/translations';
import { BannerAd } from '../../../components/BannerAd';

export interface Listing {
  id: string;
  title: string;
  price: string;
  currency: string;
  category: string;
  location: string;
  createdAt: string;
  username: string;
  description?: string;
  image_url?: string;
  additional_images?: string[];
  video_url?: string;
  source?: string;
  external_id?: string;
  country?: string;
  is_priority?: boolean;
  is_vip?: boolean;
  vip_until?: string;
  title_ru?: string;
  title_en?: string;
  title_tr?: string;
  description_ru?: string;
  description_en?: string;
  description_tr?: string;
  metadata?: {
     year?: number;
     mileage?: number;
     rooms?: string;
     area?: number;
  };
}

export function getTranslatedField(item: any, field: string, lang: string) {
  const val = item[`${field}_${lang}`];
  if (val) return val;
  if (field === 'title' || field === 'location') {
     return translateListingText(item[field] || '', lang);
  }
  return item[field] || '';
}

export default function ListingDetailClient({ initialListing }: { initialListing: Listing | null }) {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(initialListing);
  const [loading, setLoading] = useState(!initialListing);
  const [activeImage, setActiveImage] = useState<string | null>(initialListing?.image_url || null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [lang, setLang] = useState<'ru'|'en'|'tr'>('ru');
  const isPromoBanner = (!activeImage || activeImage.includes('promo_banner')) && listing?.category !== 'Новости';

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'tr') setLang('tr');
    else if (browserLang === 'en') setLang('en');
    else setLang('ru');
  }, []);

  useEffect(() => {
    if (listing && typeof window !== 'undefined') {
      const favs = JSON.parse(localStorage.getItem('pm_favorites') || '[]');
      setIsFavorite(favs.includes(listing.id));
    }
  }, [listing]);

  const toggleFavorite = () => {
    if (!listing || typeof window === 'undefined') return;
    const favs = JSON.parse(localStorage.getItem('pm_favorites') || '[]');
    let updated: string[] = [];
    if (favs.includes(listing.id)) {
      updated = favs.filter((f: string) => f !== listing.id);
      setIsFavorite(false);
    } else {
      updated = [...favs, listing.id];
      setIsFavorite(true);
    }
    localStorage.setItem('pm_favorites', JSON.stringify(updated));
  };


  useEffect(() => {
    // If we already have initialListing from the server, skip client-side fetch
    if (initialListing) {
      setListing(initialListing);
      setActiveImage(initialListing.image_url || null);
      setLoading(false);
      return;
    }

    async function fetchListing() {
      try {
        setLoading(true);
        const res = await fetch(`/api/listings?id=${params.id}`);
        const found = await res.json();
        if (found && !found.error) {
          setListing(found);
          setActiveImage(found.image_url || null);
        }
      } catch (error) {
        console.error('Failed to fetch listing:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [params.id, initialListing]);

  // Helper to extract YouTube Video ID and make secure Embed URL
  function getYouTubeEmbedUrl(url: string) {
    if (!url) return null;
    let videoId = '';
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.hostname.includes('youtube.com')) {
        if (urlObj.pathname.includes('embed')) {
          return url; // Already embed
        }
        videoId = urlObj.searchParams.get('v') || '';
      }
    } catch (e) {}
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  // Rich Text Formatter: Automatically turns @mentions and Links into Clickable UI Tags
  function renderDescription(text: string) {
    if (!text) return null;
    
    // Captures: @usernames, https://... links, and t.me/... paths
    const combinedPattern = /((?:@[a-zA-Z0-9_]{4,32})|(?:https?:\/\/[^\s]+)|(?:t\.me\/[^\s]+))/gi;
    const parts = text.split(combinedPattern);
    
    return parts.map((part, i) => {
      if (!part) return null;
      
      // 1. Handle @mentions
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <a 
            key={i} 
            href={`https://t.me/${username}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline font-bold bg-blue-50/70 px-1.5 py-0.5 rounded-md transition-all duration-200 inline-flex items-center gap-0.5"
          >
            {part}
          </a>
        );
      }
      
      // 2. Handle t.me/ direct pathing
      if (part.toLowerCase().startsWith('t.me/')) {
        return (
          <a 
            key={i} 
            href={`https://${part}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors duration-200"
          >
            {part}
          </a>
        );
      }
      
      // 3. Handle HTTP/HTTPS urls
      if (part.toLowerCase().startsWith('http')) {
        return (
          <a 
            key={i} 
            href={part}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline font-semibold break-all transition-colors duration-200"
          >
            {part}
          </a>
        );
      }
      
      // 4. Normal Text: Strip raw telegram asterisks (*) for clean layout
      return part.replace(/\*/g, '');
    });
  }

  if (loading) {
    return <div className="min-h-screen bg-[#f2f4f7] flex items-center justify-center">Загрузка...</div>;
  }

  if (!listing) {
    return <div className="min-h-screen bg-[#f2f4f7] flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Объявление не найдено</h1>
      <Link href="/" className="text-blue-600 hover:underline font-bold mt-2">Вернуться на главную</Link>
    </div>;
  }

  // Smart Contact Resolver:
  const isTelegram = listing.username && listing.username.startsWith('tg_');
  const cleanUsername = isTelegram ? listing.username.replace('tg_', '') : '';
  const isNumeric = /^\d+$/.test(cleanUsername);
  
  // Blacklist of official system usernames & monitored source groups that must NEVER be parsed as individual sellers
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
  
  // 1. Try to extract an ACTUAL direct username from text as backup, ignoring our injected promo tag
  const matches = (listing.description || '').match(/@([a-zA-Z0-9_]{4,32})/g) || [];
  const extractedUser = matches.map(m => m.slice(1)).find(u => !officialUsernames.includes(u.toLowerCase())) || null;

  // 2. Check if database username is just our group name fallback
  const isGroupFallback = officialUsernames.includes(cleanUsername.toLowerCase()) || isNumeric;

  // 3. Resolve final display and target link
  const finalSeller = extractedUser 
    ? `@${extractedUser}` 
    : (!isGroupFallback && cleanUsername ? `@${cleanUsername}` : null);

  // Link priority: 1. Safe extracted user, 2. Safe db user, 3. Fallback group thread (Only if Official!)
  const isOfficialGroup = cleanUsername.toLowerCase().includes('northcyprus_island') || cleanUsername.toLowerCase().includes('news_cyprus_north');
  const tgLink = extractedUser 
     ? `https://t.me/${extractedUser}` 
     : (!isGroupFallback && cleanUsername
        ? `https://t.me/${cleanUsername}`
        : (isTelegram 
            ? (isOfficialGroup
                ? (isNumeric 
                    ? `https://t.me/c/${cleanUsername}/${listing.external_id || ''}`
                    : `https://t.me/${cleanUsername}/${listing.external_id || ''}`)
                : `https://t.me/BotHelpG_bot?start=help`)
            : ''));
    
  const youtubeEmbed = getYouTubeEmbedUrl(listing.video_url || '');
  const allImages = listing.image_url ? [listing.image_url, ...(listing.additional_images || [])] : [];

  return (
    <div className="min-h-screen font-sans">
      {/* Header */}
      <nav className="glass-nav sticky top-0 z-50 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
           <Link 
              href="/" 
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-lg px-6 py-3 rounded-xl hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all shadow-md tracking-tight border border-blue-400/20"
           >
              <span className="text-xl animate-pulse">🏘️</span> PulseMarket — Все объявления
           </Link>
        </div>
      </nav>

      {/* Breadcrumb Navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-blue-600 transition-colors font-medium flex items-center gap-1">
            🏠 Главная
          </Link>
          <span className="text-gray-300">›</span>
          <Link href="/" className="hover:text-blue-600 transition-colors font-medium">
            {listing.category}
          </Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-900 font-semibold line-clamp-1 max-w-[300px]" title={getTranslatedField(listing, 'title', lang)}>{getTranslatedField(listing, 'title', lang)}</span>
        </nav>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card overflow-hidden flex flex-col md:flex-row">
           <div className="md:w-3/5 relative flex flex-col">
              <div className="relative aspect-[4/3] md:aspect-auto md:h-[450px] w-full bg-black">
                {!isPromoBanner ? (
                  <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-900/40">
                    {/* Glowing blurred background reflection */}
                    <img 
                      src={activeImage?.includes('promo_banner') && listing.category === 'Новости' ? '/uploads/telegram/default_news.jpg' : (activeImage || "/promo_banner.webp")} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-110 pointer-events-none select-none" 
                    />
                    {/* Crisp high-fidelity main image foreground */}
                    <img 
                      src={activeImage?.includes('promo_banner') && listing.category === 'Новости' ? '/uploads/telegram/default_news.jpg' : (activeImage || "/promo_banner.webp")} 
                      alt={getTranslatedField(listing, 'title', lang)} 
                      className="relative z-10 w-full h-full object-contain transition-all duration-300" 
                    />
                  </div>
                ) : (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                      <Link
                        href="https://t.me/BotHelpG_bot?start=alerts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-6 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center text-4xl text-white animate-pulse group-hover:animate-none">
                              🔔
                            </div>
                            <div>
                              <h3 className="text-xl font-extrabold flex items-center gap-2">
                                {lang === 'ru' ? 'Перехватывайте лучшие товары первым' : lang === 'tr' ? 'Telegram Anında Bildirimler' : 'Instant Telegram Notifications'}
                                <span className="bg-yellow-400 text-blue-950 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-md animate-bounce">
                                  VIP
                                </span>
                              </h3>
                              <p className="text-sm text-blue-100 font-medium mt-1">
                                {lang === 'ru' ? 'Подпишитесь, чтобы получать эксклюзивные предложения мгновенно' : lang === 'tr' ? 'Özel teklifler anında alın' : 'Subscribe for exclusive offers instantly'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                )}
              </div>
              {/* Thumbnail Strip */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 p-4 overflow-x-auto border-t border-white/10">
                  {allImages.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative min-w-[60px] h-[60px] rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-blue-600 ring-2 ring-blue-100 scale-105 z-10' : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'}`}
                    >
                      <img src={img} alt={`${getTranslatedField(listing, 'title', lang)} - фото ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
           </div>
           <div className="md:w-2/5 p-8 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                 <div className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full w-max">
                    {listing.category}
                 </div>
                 {listing.is_vip && (
                    <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse">
                       ⭐ VIP
                    </div>
                 )}
                 {listing.is_priority && listing.source && (() => {
                    const cleanName = (listing.source || '')
                       .replace(/Telegram\s\(@/gi, '')
                       .replace(/\)/gi, '')
                       .replace(/Recovery/gi, '')
                       .trim();
                    const isSupreme = cleanName.toLowerCase().includes('northcyprus_island');
                    
                    if (isSupreme) {
                       return (
                          <a 
                             href={"https://t.me/" + String(cleanName).replace("@", "").trim()} 
                             target="_blank" 
                             rel="noreferrer"
                             className="text-[11px] font-black uppercase tracking-widest border px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 hover:shadow-md hover:brightness-110 text-blue-700 bg-blue-50 border-blue-200"
                             title="Открыть официальный канал"
                           >
                              👑 ОФИЦИАЛЬНЫЙ КАНАЛ
                           </a>
                       );
                    } else {
                       return null;
                    }
                 })()}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6 leading-tight">{getTranslatedField(listing, 'title', lang)}</h1>
              <div className="text-4xl font-black text-gray-900 mb-6">
                 {Number(listing.price).toLocaleString()} <span className="text-2xl font-bold text-gray-500">{listing.currency}</span>
              </div>
              
              <div className="space-y-4 mb-8 flex-1">
                 <div className="flex items-center gap-3 text-gray-600">
                    <span className="text-xl">📍</span>
                    <span className="font-medium">{getTranslatedField(listing, 'location', lang)}</span>
                 </div>
                 {finalSeller && (
                    <div className="flex flex-col mb-2">
                       <div className="flex items-center gap-3 text-gray-600">
                          <span className="text-xl">👤</span>
                          <span className="font-medium">Продавец: {finalSeller}</span>
                       </div>
                       <div className="flex items-center gap-2 mt-1.5 ml-8 cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors w-max" title="Отзывы скоро появятся">
                          <div className="flex items-center text-amber-400 text-sm">
                             <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                             <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                             <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                             <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                             <svg className="w-4 h-4 fill-current text-gray-300" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          </div>
                          <span className="text-gray-700 font-bold text-sm">4.0</span>
                          <span className="text-blue-600 text-sm border-b border-blue-600 border-dashed hover:border-solid pb-0.5">Новичок (0 отзывов)</span>
                       </div>
                    </div>
                 )}
                 <div className="flex items-center gap-3 text-gray-600">
                    <span className="text-xl">📅</span>
                    <span className="font-medium">{new Date(listing.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                 </div>
                  
                  {/* Enhanced Features for Individual Detailed Views */}
                  {listing.metadata?.rooms && (
                     <div className="flex items-center gap-3 text-gray-600">
                        <span className="text-xl">🛏️</span>
                        <span className="font-medium">Комнатность: {listing.metadata.rooms}</span>
                     </div>
                  )}
                  {listing.metadata?.area && (
                     <div className="flex items-center gap-3 text-gray-600">
                        <span className="text-xl">📐</span>
                        <span className="font-medium">Площадь: {listing.metadata.area} м²</span>
                     </div>
                  )}
                  {listing.metadata?.year && (
                     <div className="flex items-center gap-3 text-gray-600">
                        <span className="text-xl">📅</span>
                        <span className="font-medium">Год: {listing.metadata.year}</span>
                     </div>
                  )}
                  {listing.metadata?.mileage && (
                     <div className="flex items-center gap-3 text-gray-600">
                        <span className="text-xl">🛣️</span>
                        <span className="font-medium">Пробег: {Number(listing.metadata.mileage).toLocaleString()} км</span>
                     </div>
                  )}
              </div>

              {isTelegram ? (
                 <a 
                   href={tgLink} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-blue-700 transition-colors mb-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-center block"
                 >
                    {listing.category === 'Новости' ? 'Перейти на источник 🔗' : 'Связаться в Telegram 💬'}
                 </a>
               ) : (
                 <button className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-blue-700 transition-colors mb-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                    Связаться с продавцом
                 </button>
               )}
              <button 
                onClick={toggleFavorite}
                className={`w-full font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5 ${isFavorite ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                 <span>{isFavorite ? '❤️ В избранном' : '🤍 Добавить в избранное'}</span>
              </button>
           </div>
        </div>

        {/* Video Block if Present */}
        {youtubeEmbed && (
          <div className="mt-8 bg-black rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-gray-900 flex items-center gap-3">
              <span className="text-red-500 text-xl font-black bg-white rounded p-0.5">▶️</span>
              <span className="text-white font-bold text-sm">Видеообзор объекта</span>
            </div>
            <div className="relative aspect-video">
              <iframe 
                src={youtubeEmbed} 
                title="YouTube Video Player"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              ></iframe>
            </div>
          </div>
        )}
        
        {listing.description && (
          <div className="mt-8 glass-card p-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Описание</h2>
            <div className="text-gray-800 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{renderDescription(getTranslatedField(listing, 'description', lang))}</div>
          </div>
        )}

        {/* Banner Ad */}
        <div className="mt-8">
          <BannerAd lang={lang} position="detail" />
        </div>

        {/* 🗺️ Interactive Location Map Section */}
        {listing.location && listing.location !== "Не указана" && (
           <div className="mt-8 glass-card overflow-hidden mb-12">
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                       <span className="bg-blue-600/20 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg">📍</span> 
                       Расположение
                    </h2>
                    <p className="text-gray-500 font-medium mt-1 ml-10">
                       {listing.location} {listing.country ? `, ${listing.country}` : ''}
                    </p>
                 </div>
                 <a 
                   href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.location} ${listing.country || 'Северный Кипр'}`)}`}
                   target="_blank"
                   rel="noreferrer"
                   className="bg-white border border-gray-200 text-gray-700 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-center shrink-0"
                 >
                    🗺️ Открыть в Навигаторе
                 </a>
              </div>
              <div className="w-full h-[400px] relative bg-slate-100">
                 <iframe 
                   title="Listing Location Map"
                   width="100%" 
                   height="100%" 
                   frameBorder="0" 
                   scrolling="no" 
                   marginHeight={0} 
                   marginWidth={0} 
                   src={`https://maps.google.com/maps?q=${encodeURIComponent(`${listing.location}, ${listing.country || 'Северный Кипр'}`)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                   className="absolute top-0 left-0 w-full h-full grayscale-[20%] contrast-[1.1]"
                 ></iframe>
              </div>
           </div>
        )}
        {/* Footer Catalog CTA */}
        <div className="flex justify-center mt-12 mb-16">
           <Link 
              href="/" 
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xl px-12 py-5 rounded-2xl hover:shadow-2xl hover:-translate-y-1.5 active:translate-y-0 transition-all duration-300 shadow-xl tracking-tight border border-blue-400/20"
           >
              <span className="text-2xl animate-pulse">🏘️</span> PulseMarket — Все объявления
           </Link>
        </div>
      </main>
    </div>
  );
}
