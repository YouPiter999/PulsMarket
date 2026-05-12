'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Listing {
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
  source?: string;
  country?: string;
  is_priority?: boolean;
  metadata?: {
     year?: number;
     mileage?: number;
     rooms?: string;
     area?: number;
  };
}

const translations = {
  ru: {
    title: "Рекомендации для вас",
    subtitle: "Объявления в",
    categories: "Все категории",
    searchPlaceholder: "Поиск по объявлениям...",
    find: "Найти",
    postAd: "Разместить объявление",
    business: "Для бизнеса",
    help: "Помощь",
    orders: "Заказы",
    login: "Вход и регистрация",
    promoTitle: "Весь рынок в одном боте и на этом сайте",
    promoDesc: "Наш ИИ-модератор собирает объявления из десятков групп, отсеивает спам и дубликаты, публикуя только качественный контент здесь и в Telegram.",
    openBot: "Открыть Telegram-бота",
    howItWorks: "Как это работает?",
    footerAbout: "О проекте",
    footerAds: "Реклама",
    footerRules: "Правила",
    footerContacts: "Контакты",
    sort: "Сортировать:",
    sortDefault: "По умолчанию",
    sortCheap: "Сначала дешевле",
    sortExp: "Сначала дороже",
    sortDate: "По дате",
    modalTitle: "Как разместить объявление?",
    modalDesc: "Все объявления публикуются автоматически из ваших Telegram-групп. Чтобы ваше объявление успешно появилось на сайте, просто пришлите в группу:",
    modalFieldPhoto: "📸 Реальную фотографию товара или услуги",
    modalFieldPrice: "💰 Цену и описание текстом в сообщении",
    modalFieldCountry: "🌍 Всё остальное наш ИИ сделает автоматически!",
    modalCTA: "Открыть Telegram-бота",
    modalClose: "Закрыть",
  },
  en: {
    title: "Recommendations for you",
    subtitle: "Listings in",
    categories: "All categories",
    searchPlaceholder: "Search listings...",
    find: "Search",
    postAd: "Post an ad",
    business: "For business",
    help: "Help",
    orders: "Orders",
    login: "Login & Registration",
    promoTitle: "The entire market in one bot and on this site",
    promoDesc: "Our AI moderator collects ads from dozens of groups, filters out spam and duplicates, publishing only high-quality content here and on Telegram.",
    openBot: "Open Telegram Bot",
    howItWorks: "How it works?",
    footerAbout: "About us",
    footerAds: "Advertising",
    footerRules: "Rules",
    footerContacts: "Contacts",
    sort: "Sort by:",
    sortDefault: "Default",
    sortCheap: "Price: Low to High",
    sortExp: "Price: High to Low",
    sortDate: "Newest first",
    modalTitle: "How to post an ad?",
    modalDesc: "All ads are published automatically from your Telegram groups. For your ad to appear on the site successfully, simply send to the group:",
    modalFieldPhoto: "📸 A real photo of the item or service",
    modalFieldPrice: "💰 Price and description in the message text",
    modalFieldCountry: "🌍 Our AI will handle everything else automatically!",
    modalCTA: "Open Telegram Bot",
    modalClose: "Close",
  },
  tr: {
    title: "Sizin için öneriler",
    subtitle: "İlanlar",
    categories: "Tüm kategoriler",
    searchPlaceholder: "İlanlarda ara...",
    find: "Bul",
    postAd: "İlan Ver",
    business: "İşletmeler için",
    help: "Yardım",
    orders: "Siparişler",
    login: "Giriş и kayıt",
    promoTitle: "Tüm pazar tek bir botta ve bu sitede",
    promoDesc: "Yapay zeka moderatörümüz düzinelerce gruptan ilan toplar, spam ve kopyaları filtreler, hem burada hem de Telegram'da yalnızca yüksek kaliteli içerik yayınlar.",
    openBot: "Telegram Botunu Aç",
    howItWorks: "Nasıl çalışır?",
    footerAbout: "Hakkımızda",
    footerAds: "Reklam",
    footerRules: "Kurallar",
    footerContacts: "İletişim",
    sort: "Sıralama:",
    sortDefault: "Varsayılan",
    sortCheap: "Önce en ucuz",
    sortExp: "Önce en pahalı",
    sortDate: "Tarihe göre",
    modalTitle: "Nasıl ilan verilir?",
    modalDesc: "Tüm ilanlar Telegram gruplarınızdan otomatik olarak yayınlanır. İlanınızın sitede başarıyla görünmesi için gruba göndermeniz yeterlidir:",
    modalFieldPhoto: "📸 Ürünün veya hizmetin gerçek bir fotoğrafı",
    modalFieldPrice: "💰 Fotoğrafa eklenmiş fiyat ve açıklama",
    modalFieldCountry: "🌍 Geri kalan her şeyi yapay zekamız otomatik halleder!",
    modalCTA: "Telegram Botunu Aç",
    modalClose: "Kapat",
  }
};

const titleDictionary: Record<string, {ru: string, en: string}> = {
  "SATILIK": { ru: "ПРОДАЖА:", en: "FOR SALE:" },
  "KİRALIK": { ru: "АРЕНДА:", en: "FOR RENT:" },
  "SATILIK DAİRE": { ru: "ПРОДАЖА КВАРТИРЫ", en: "APARTMENT FOR SALE" },
  "KİRALIK DAİRE": { ru: "АРЕНДА КВАРТИРЫ", en: "APARTMENT FOR RENT" },
  "DAİRE": { ru: "КВАРТИРА", en: "APARTMENT" },
  "ARSALAR": { ru: "УЧАСТКИ", en: "LAND PLOTS" },
  "ARSA": { ru: "УЧАСТОК", en: "LAND" },
  "MÜSTAKİL VİLLA": { ru: "ОТДЕЛЬНАЯ ВИЛЛА", en: "DETACHED VILLA" },
  "MÜSTAKİL": { ru: "ОТДЕЛЬНЫЙ", en: "DETACHED" },
  "VİLLA": { ru: "ВИЛЛА", en: "VILLA" },
  "TÜRK MALI": { ru: "ТУРЕЦКИЙ ТИТУЛ", en: "TURKISH TITLE DEED" },
  "APARTMAN YAPIMINA UYGUN": { ru: "ПОД ЗАСТРОЙКУ ДОМА", en: "SUITABLE FOR BUILDING" },
  "APARTMAN": { ru: "ЖИЛОЙ ДОМ", en: "APARTMENT BUILDING" },
  "ANAYOLU ÜZERİ": { ru: "У ГЛАВНОЙ ДОРОГИ", en: "ON MAIN ROAD" },
  "CADDE ÜZERİNDE": { ru: "НА УЛИЦЕ", en: "ON THE STREET" },
  "DENİZ MANZARALI": { ru: "С ВИДОМ НА МОРЕ", en: "SEA VIEW" },
  "HAVUZLU": { ru: "С БАССЕЙНОМ", en: "WITH POOL" },
  "TERASLI": { ru: "С ТЕРРАСОЙ", en: "WITH TERRACE" },
  "KÖŞE": { ru: "УГЛОВОЙ", en: "CORNER" },
  "GÜNLÜK": { ru: "ПОСУТОЧНО", en: "DAILY" },
  "AYLIK ÖDEMELİ": { ru: "С ЕЖЕМЕСЯЧНОЙ ОПЛАТОЙ", en: "WITH MONTHLY PAYMENT" },
  "AYLIK": { ru: "В МЕСЯЦ", en: "MONTHLY" },
  "FIRSAT": { ru: "ВЫГОДНО", en: "BARGAIN" },
  "STÜDYO": { ru: "СТУДИЯ", en: "STUDIO" },
  "DENİZE SIFIR": { ru: "ПЕРВАЯ ЛИНИЯ", en: "BEACHFRONT" },
  "EŞYALI": { ru: "С МЕБЕЛЬЮ", en: "FURNISHED" }
};

function translateListingText(text: string, targetLang: string) {
  if (targetLang === 'tr') return text;
  let translated = text;
  
  // Replace words (case-insensitive for Turkish)
  const sortedKeys = Object.keys(titleDictionary).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    const translation = titleDictionary[key][targetLang as 'ru' | 'en'];
    // Create a regex to match the word case-insensitively, supporting Turkish chars
    const regex = new RegExp(key.replace(/İ/g, '[İiıI]').replace(/Ş/g, '[Şş]').replace(/Ç/g, '[Çç]').replace(/Ü/g, '[Üü]').replace(/Ö/g, '[Öö]').replace(/Ğ/g, '[Ğğ]'), 'gi');
    translated = translated.replace(regex, translation);
  }
  
  return translated;
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('Северный Кипр');
  const [lang, setLang] = useState<'ru' | 'en' | 'tr'>('ru');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'CHOICE' | 'TELEGRAM' | 'WEB'>('CHOICE');
  
  // Filtering & Search States
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    currency: '$',
    description: '',
    location: '',
    country: 'Северный Кипр',
    contact: '',
    category: 'Недвижимость',
    listing_type: 'Аренда',
    rooms: '2+1',
    distance_to_sea: '',
    year: '',
    mileage: '',
    image_url: '',
    video_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Helper to reload data
  async function fetchListings() {
    setLoading(true);
    try {
      const res = await fetch('/api/listings');
      const data = await res.json();
      setListings(data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 1. Detect language automatically
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'tr') setLang('tr');
    else if (browserLang === 'en') setLang('en');
    else setLang('ru'); // Default to RU for your primary audience

    // 2. Check auth state locally
    const storedUser = localStorage.getItem('pulse_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch(e) {}
    }

    // 3. Fetch listings
    fetchListings();
  }, []);

  const t = translations[lang];

  const categories = [
    { id: 'Все', name: lang === 'ru' ? 'Все' : lang === 'tr' ? 'Hepsi' : 'All', icon: '🏠' },
    { id: 'Недвижимость', name: lang === 'ru' ? 'Недвижимость' : lang === 'tr' ? 'Emlak' : 'Real Estate', icon: '🏘️' },
    { id: 'Транспорт', name: lang === 'ru' ? 'Транспорт' : lang === 'tr' ? 'Vasıta' : 'Transport', icon: '🚗' },
    { id: 'Электроника', name: lang === 'ru' ? 'Электроника' : lang === 'tr' ? 'Elektronik' : 'Electronics', icon: '💻' },
    { id: 'Услуги', name: lang === 'ru' ? 'Услуги' : lang === 'tr' ? 'Hizmetler' : 'Services', icon: '🛠️' },
    { id: 'Работа', name: lang === 'ru' ? 'Работа' : lang === 'tr' ? 'İş' : 'Jobs', icon: '💼' },
    { id: 'Вещи', name: lang === 'ru' ? 'Вещи' : lang === 'tr' ? 'Eşyalar' : 'Goods', icon: '👕' },
    { id: 'Новости', name: lang === 'ru' ? 'Новости' : lang === 'tr' ? 'Haberler' : 'News', icon: '📢' },
  ];

  // Start with comprehensive defaults with flags
  const countryFlags: { [key: string]: { flag: string; code: string } } = {
    'Северный Кипр': { flag: '🏝️', code: 'TRNC' },
    'Турция': { flag: '🇹🇷', code: 'TR' },
    'Россия': { flag: '🇷🇺', code: 'RU' },
    'ОАЭ': { flag: '🇦🇪', code: 'UAE' },
    'Испания': { flag: '🇪🇸', code: 'ES' },
    'Таиланд': { flag: '🇹🇭', code: 'TH' },
    'Грузия': { flag: '🇬🇪', code: 'GE' },
    'Казахстан': { flag: '🇰🇿', code: 'KZ' }
  };

  // Build unique countries dynamically from active listings
  const activeCountriesSet = new Set<string>();
  activeCountriesSet.add('Северный Кипр');
  activeCountriesSet.add('Турция');
  activeCountriesSet.add('Россия');
  activeCountriesSet.add('ОАЭ');
  activeCountriesSet.add('Испания'); // Spain is always present as requested!

  listings.forEach(item => {
    if (item.country) {
      activeCountriesSet.add(item.country);
    }
  });

  const countries = Array.from(activeCountriesSet).map(name => ({
    name,
    code: countryFlags[name]?.code || name.substring(0, 3).toUpperCase(),
    flag: countryFlags[name]?.flag || '🌍'
  }));

  return (
    <div className="min-h-screen bg-[#f2f4f7] font-sans">
      {/* Upper Navbar (Location/Language) */}
      <div className="bg-white border-b text-xs text-gray-500 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
              <span>📍</span>
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-transparent border-none p-0 focus:ring-0 text-xs font-medium cursor-pointer"
              >
                {countries.map(c => (
                  <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
            <span className="hover:text-blue-600 cursor-pointer">{t.business}</span>
            <span className="hover:text-blue-600 cursor-pointer">{t.help}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4 border-r pr-4">
               <button onClick={() => setLang('ru')} className={`hover:text-blue-600 ${lang === 'ru' ? 'text-blue-600 font-bold' : ''}`}>RU</button>
               <button onClick={() => setLang('tr')} className={`hover:text-blue-600 ${lang === 'tr' ? 'text-blue-600 font-bold' : ''}`}>TR</button>
               <button onClick={() => setLang('en')} className={`hover:text-blue-600 ${lang === 'en' ? 'text-blue-600 font-bold' : ''}`}>EN</button>
            </div>
            <span className="hover:text-blue-600 cursor-pointer">{t.orders}</span>
            {currentUser ? (
              <Link href="/profile" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer group">
                {currentUser.photo_url ? (
                  <img src={currentUser.photo_url} alt="Me" className="w-5 h-5 rounded-full border border-gray-200" />
                ) : (
                  <span className="text-base">👤</span>
                )}
                <span className="font-bold text-gray-900 group-hover:text-blue-600">{currentUser.first_name || 'Профиль'}</span>
              </Link>
            ) : (
              <Link href="/login" className="hover:text-blue-600 cursor-pointer font-semibold text-gray-900">{t.login}</Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-white border-b sticky top-0 z-50 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">PulseMarket</span>
          </div>
          
          <div className="flex-1 flex gap-2">
            <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shrink-0">
              <span>☰</span>
              {t.categories}
            </button>
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-blue-600 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-0 text-gray-900"
              />
              <button className="absolute right-0 top-0 bottom-0 bg-blue-600 text-white px-6 rounded-r-lg font-bold hover:bg-blue-700 transition-all">
                {t.find}
              </button>
            </div>
          </div>

          <button 
            onClick={() => {
              setModalView('CHOICE');
              setIsModalOpen(true);
            }}
            className="bg-white border-2 border-gray-200 text-gray-900 px-5 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition-all shrink-0"
          >
            {t.postAd}
          </button>
        </div>
      </nav>

      {/* Categories Grid (Properly Aligned) */}
      <div className="bg-white py-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4 justify-items-center">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              // Live count for active category visibility
              const count = listings.filter(l => {
                const sameCountry = (l.country || 'Северный Кипр').toLowerCase() === selectedCountry.toLowerCase();
                return sameCountry && (cat.id === 'Все' ? true : l.category === cat.id);
              }).length;

              return (
                <button 
                  key={cat.id} 
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex flex-col items-center gap-2 group w-full transition-all relative"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-all duration-300 ${isActive ? 'bg-blue-600 text-white scale-110 shadow-blue-200 shadow-lg' : 'bg-[#f2f4f7] group-hover:bg-blue-50 group-hover:scale-105'}`}>
                    {cat.icon}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-xs font-bold text-center line-clamp-1 ${isActive ? 'text-blue-600' : 'text-gray-700'}`}>{cat.name}</span>
                    <span className="text-[10px] font-medium text-gray-400">{count}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
            <p className="text-gray-500">{t.subtitle} {selectedCountry}</p>
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium text-gray-400">{t.sort}</span>
            <select className="bg-transparent border-none text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer p-0">
              <option>{t.sortDefault}</option>
              <option>{t.sortCheap}</option>
              <option>{t.sortExp}</option>
              <option>{t.sortDate}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white h-[380px] rounded-2xl animate-pulse shadow-sm"></div>
            ))}
          </div>
        ) : (() => {
          const filteredByCountry = listings.filter(item => {
            const itemCountry = item.country || 'Северный Кипр';
            // 📢 NEWS EXEMPTION: News always pass country filter so they are visible!
            const matchesCountry = item.category === 'Новости' || itemCountry.toLowerCase() === selectedCountry.toLowerCase();
            
            // Apply Active Search Query Filter
            const matchesSearch = searchQuery 
              ? (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                 item.location.toLowerCase().includes(searchQuery.toLowerCase()))
              : true;
              
            // Apply Category Sidebar Filter
            const matchesCategory = selectedCategory === 'Все' 
              ? true 
              : item.category === selectedCategory;

            return matchesCountry && matchesSearch && matchesCategory;
          });

          // Differentiate listings strictly for general view splits and sort by PRIORITY LEVEL then DATE
          // 📢 NEWS REPAIR: Allow News items to load in main grid IF explicitly selected category!
          const marketplaceListings = filteredByCountry
            .filter(item => selectedCategory === 'Новости' ? true : item.category !== 'Новости')
            .sort((a, b) => {
                const getScore = (listing: any) => {
                   if (!listing.is_priority) return 0;
                   const src = String(listing.source || '').toLowerCase();
                   if (src.includes('northcyprus_island')) return 2; // Supreme Tier
                   return 1; // Secondary Admin Tier
                };
                
                const scoreA = getScore(a);
                const scoreB = getScore(b);
                
                if (scoreB !== scoreA) return scoreB - scoreA; // Put higher priority score first!
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            
          // 📢 GLOBAL NEWS: Sidebar news items are always global and NOT affected by specific grid categories/search!
          const newsListings = listings
            .filter(item => item.category === 'Новости')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          return (
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Left Side: General Marketplace Grid (70% width on desktop) */}
              <div className="flex-1 lg:w-2/3">
                {marketplaceListings.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
                    <span className="text-5xl mb-4 block">📦</span>
                    <p className="font-semibold text-lg text-gray-800">
                      {lang === 'ru' ? 'Нет активных объявлений' : lang === 'tr' ? 'Aktif ilan yok' : 'No active listings'}
                    </p>
                    <p className="text-sm mt-1">
                      {lang === 'ru' ? 'Опубликуйте первое объявление через нашего Telegram-бота!' : lang === 'tr' ? 'Telegram botumuz aracılığıyla ilk ilanı yayınlayın!' : 'Post the first listing via our Telegram bot!'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                    {marketplaceListings.map((item) => (
                      <Link href={`/listing/${item.id}`} key={item.id} className="group cursor-pointer block">
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-white shadow-sm">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <img 
                              src="/promo_banner.png" 
                              alt="PulseMarket Promo" 
                              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                            />
                          )}
                          <div className="absolute top-3 right-3 flex flex-col gap-2">
                            <button className="bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg hover:bg-white transition-all text-gray-400 hover:text-red-500">
                              🤍
                            </button>
                          </div>
                          {/* 🔥 PREMIUM PRIORITY BADGE LOGIC 🔥 */}
                          {item.is_priority ? (() => {
                             const cleanName = (item.source || '')
                               .replace(/Telegram\s\(@/gi, '')
                               .replace(/\)/gi, '')
                               .replace(/Recovery/gi, '')
                               .trim();
                             const isSupreme = cleanName.toLowerCase().includes('northcyprus_island');
                             
                             return (
                               <div className={`absolute bottom-3 left-3 bg-gradient-to-r ${isSupreme ? 'from-blue-600 to-indigo-700 shadow-blue-500/40' : 'from-amber-500 to-orange-600 shadow-orange-500/30'} backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wider shadow-lg border border-white/20 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-110 hover:brightness-110 z-20`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const u = String(cleanName).replace('@','').trim();
                                    if(u) window.open('https://t.me/' + u, '_blank');
                                  }}
                                  title={isSupreme ? 'Открыть канал' : 'Перейти в Telegram'}
                                >
                                 <span>👑</span>
                                 <span>{isSupreme ? 'ОФИЦИАЛЬНЫЙ КАНАЛ' : (cleanName || 'ПРИОРИТЕТ')}</span>
                               </div>
                             );
                          })() : null /* Hide others! */}
                        </div>
                        
                        <div className="px-1">
                          <h3 className="text-lg font-medium text-gray-900 leading-tight mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors" title={item.title}>
                            {translateListingText(item.title, lang)}
                          </h3>
                          
                          {/* Smart Parameter Tags Row */}
                          {(item.metadata?.year || item.metadata?.rooms || item.metadata?.mileage || item.metadata?.area) && (
                             <div className="flex flex-wrap gap-1.5 mb-2">
                                {item.metadata?.year && (
                                   <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">📅 {item.metadata.year}</span>
                                )}
                                {item.metadata?.rooms && (
                                   <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">🛏️ {item.metadata.rooms}</span>
                                )}
                                {item.metadata?.area && (
                                   <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded">📐 {item.metadata.area} м²</span>
                                )}
                                {item.metadata?.mileage && (
                                   <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">🛣️ {Number(item.metadata.mileage).toLocaleString()} км</span>
                                )}
                             </div>
                          )}
                          <div className="text-2xl font-black text-gray-900 mb-2">
                            {Number(item.price).toLocaleString()} <span className="text-lg font-bold">{item.currency}</span>
                          </div>
                          <div className="flex flex-col gap-1 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <span>📍</span> {translateListingText(item.location, lang)}
                            </div>
                            <div className="text-gray-400 mt-1">
                              {new Date(item.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long' })}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side: Sticky "НОВОСТИ" (NEWS) Column (30% width on desktop) */}
              <div className="lg:w-1/3">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 lg:sticky lg:top-24">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔥</span>
                      <h2 className="text-xl font-extrabold text-gray-900">
                        {lang === 'ru' ? 'Новости' : lang === 'tr' ? 'Haberler' : 'News'}
                      </h2>
                    </div>
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                      {lang === 'ru' ? 'В эфире' : lang === 'tr' ? 'Canlı' : 'Live'}
                    </span>
                  </div>

                  {newsListings.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <span className="text-4xl block mb-2">📰</span>
                      <p className="text-sm font-medium">
                        {lang === 'ru' ? 'Пока нет свежих новостей' : lang === 'tr' ? 'Henüz haber yok' : 'No news yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6 max-h-[550px] overflow-y-auto pr-2">
                      {newsListings.slice(0, 9).map((news) => (
                        <Link href={`/listing/${news.id}`} key={news.id} className="group border-b border-gray-100 pb-5 last:border-0 last:pb-0 block cursor-pointer">
                          {news.image_url && (
                            <div className="aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-gray-50">
                              <img 
                                src={news.image_url} 
                                alt={news.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-md uppercase mb-2 inline-block">
                              {news.source || 'Telegram News'}
                            </span>
                            <h3 className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-blue-600 transition-colors mb-2 line-clamp-3">
                              {translateListingText(news.title, lang)}
                            </h3>
                            <div className="text-[11px] text-gray-400">
                              {new Date(news.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </Link>
                      ))}
                      
                      {/* 🔥 "Смотреть остальные" CTA Banner 🔥 */}
                      {newsListings.length > 9 && (
                        <Link 
                          href="https://t.me/news_cyprus_north" 
                          target="_blank"
                          className="mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border border-indigo-100 text-indigo-700 py-4 px-4 rounded-2xl transition-all group"
                        >
                          <div className="flex flex-col items-center text-center">
                            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                              Читать все новости <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                            <span className="text-[10px] font-bold text-indigo-400 mt-0.5">в нашем Telegram-канале</span>
                          </div>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </main>

      {/* Modern Bot Promotion Section */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-20">
        <div className="bg-indigo-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="relative z-10 lg:w-2/3">
            <div className="inline-block bg-indigo-500/50 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              Powered by Antigravity AI
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-[1.1]">
              {t.promoTitle}
            </h2>
            <p className="text-indigo-100 text-lg mb-10 max-w-xl">
              {t.promoDesc}
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-xl hover:-translate-y-1">
                {t.openBot}
              </button>
              <button className="bg-indigo-500 text-white border-2 border-indigo-400 px-8 py-4 rounded-2xl font-black hover:bg-indigo-400 transition-all">
                {t.howItWorks}
              </button>
            </div>
          </div>
          <div className="relative z-10 lg:w-1/3 flex justify-center">
             <div className="w-64 h-64 bg-white/10 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
             <div className="text-[12rem] animate-bounce">🤖</div>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full -ml-48 -mb-48 blur-3xl"></div>
        </div>
      </section>

      <footer className="bg-white py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-gray-900">PulseMarket</span>
              <span className="text-xs text-gray-400">by Sergey</span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-gray-500">
              <span className="hover:text-blue-600 cursor-pointer">{t.footerAbout}</span>
              <span className="hover:text-blue-600 cursor-pointer">{t.footerAds}</span>
              <span className="hover:text-blue-600 cursor-pointer">{t.footerRules}</span>
              <span className="hover:text-blue-600 cursor-pointer">{t.footerContacts}</span>
            </div>
            <p className="text-gray-400 text-xs font-medium">
              &copy; 2026 PulseMarket | Built with Antigravity AI
            </p>
          </div>
        </div>
      </footer>

      {/* Modal Reminder for Mandatory Fields */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-gray-100 text-gray-900 my-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-xl font-bold transition-colors z-10"
            >
              ✕
            </button>

            {modalView === 'CHOICE' && (
              <div className="py-4 text-center">
                <div className="text-5xl mb-4">🤔</div>
                <h2 className="text-2xl font-black text-gray-900 mb-6">Как хотите разместить?</h2>
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => setModalView('TELEGRAM')}
                    className="flex items-center gap-4 p-5 bg-blue-50 border border-blue-100 rounded-2xl text-left hover:bg-blue-100 transition-all group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">🤖</span>
                    <div>
                      <h3 className="font-bold text-blue-900">Через Telegram (Рекомендуется)</h3>
                      <p className="text-xs text-blue-700 mt-0.5">Быстро, автоматически, через ИИ-модератора.</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setModalView('WEB')}
                    className="flex items-center gap-4 p-5 bg-purple-50 border border-purple-100 rounded-2xl text-left hover:bg-purple-100 transition-all group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">✍️</span>
                    <div>
                      <h3 className="font-bold text-purple-900">Напрямую на сайте</h3>
                      <p className="text-xs text-purple-700 mt-0.5">Если нет Telegram. Заполните форму вручную.</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {modalView === 'TELEGRAM' && (
              <>
                <div className="text-center mb-4">
                  <span className="text-5xl">📝</span>
                  <h2 className="text-2xl font-black text-gray-900 mt-3">{t.modalTitle}</h2>
                </div>
                <p className="text-gray-600 mb-5 text-sm text-center leading-relaxed">
                  {t.modalDesc}
                </p>
                <div className="bg-gray-50 rounded-2xl p-5 mb-6 flex flex-col gap-4 border border-gray-100">
                  <div className="flex items-center gap-3 text-gray-800 font-semibold text-sm">
                    <span>{t.modalFieldPhoto}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-800 font-semibold text-sm">
                    <span>{t.modalFieldPrice}</span>
                  </div>
                  <div className="text-indigo-600 bg-indigo-50 border border-indigo-100/50 rounded-xl p-3 text-xs font-bold text-center mt-1">
                    {t.modalFieldCountry}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Link 
                    href="https://t.me/BotHelpG_bot" 
                    target="_blank"
                    className="bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-center hover:bg-indigo-700 transition-all shadow-lg text-sm"
                  >
                    {t.modalCTA}
                  </Link>
                  <button 
                    onClick={() => setModalView('CHOICE')}
                    className="text-gray-500 text-sm font-semibold hover:text-gray-700 underline mt-2"
                  >
                    Вернуться назад
                  </button>
                </div>
              </>
            )}

            {modalView === 'WEB' && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                try {
                  const res = await fetch('/api/listings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...formData,
                      description: `${formData.description}\n\n📞 Контакт: ${formData.contact}`,
                      source: 'WEB',
                      owner_id: currentUser?.telegram_id || null
                    })
                  });
                  if(res.ok) {
                     alert('Объявление успешно добавлено!');
                     setIsModalOpen(false);
                     fetchListings();
                  } else {
                     const err = await res.json();
                     alert('Ошибка: ' + (err.message || 'Проверьте заполнение'));
                  }
                } catch(e) {
                  alert('Сетевая ошибка!');
                } finally {
                  setIsSubmitting(false);
                }
              }}>
                <div className="text-center mb-5">
                  <h2 className="text-xl font-black text-gray-900">Новое объявление</h2>
                  <p className="text-xs text-gray-500 mt-1">Заполните поля, чтобы опубликовать без Telegram</p>
                </div>
                <div className="space-y-3.5 max-h-[60vh] overflow-y-auto px-1">
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Заголовок *</label>
                    <input required minLength={3} type="text" placeholder="Что продаете?" value={formData.title} onChange={f => setFormData({...formData, title: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50" />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Категория *</label>
                    <select value={formData.category} onChange={f => setFormData({...formData, category: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-white shadow-sm font-semibold">
                      <option value="Недвижимость">🏠 Недвижимость</option>
                      <option value="Транспорт">🚗 Транспорт</option>
                      <option value="Услуги">🛠️ Услуги</option>
                      <option value="Вещи">📦 Вещи и товары</option>
                      <option value="Работа">💼 Работа</option>
                    </select>
                  </div>

                  {/* Conditional Real Estate Fields */}
                  {formData.category === 'Недвижимость' && (
                    <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-black text-blue-800 mb-1 block">Тип сделки</label>
                          <select value={formData.listing_type} onChange={f => setFormData({...formData, listing_type: f.target.value})} className="w-full border border-blue-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none bg-white">
                            <option>Аренда</option><option>Продажа</option><option>Посуточно</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-black text-blue-800 mb-1 block">Планировка</label>
                          <select value={formData.rooms} onChange={f => setFormData({...formData, rooms: f.target.value})} className="w-full border border-blue-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none bg-white">
                            <option>Студия</option><option>1+1</option><option>2+1</option><option>3+1</option><option>4+ и больше</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-black text-blue-800 mb-1 block">🌊 Расстояние до моря (метров/км)</label>
                        <input type="text" placeholder="Напр: 500м или 5 мин пешком" value={formData.distance_to_sea} onChange={f => setFormData({...formData, distance_to_sea: f.target.value})} className="w-full border border-blue-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none bg-white" />
                      </div>
                    </div>
                  )}

                  {/* Conditional Transport Fields */}
                  {formData.category === 'Транспорт' && (
                    <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-black text-amber-800 mb-1 block">Год выпуска</label>
                          <input type="number" placeholder="2022" value={formData.year} onChange={f => setFormData({...formData, year: f.target.value})} className="w-full border border-amber-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none bg-white" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-black text-amber-800 mb-1 block">Пробег (км)</label>
                          <input type="number" placeholder="50000" value={formData.mileage} onChange={f => setFormData({...formData, mileage: f.target.value})} className="w-full border border-amber-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none bg-white" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Цена *</label>
                      <input required type="number" placeholder="1000" value={formData.price} onChange={f => setFormData({...formData, price: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50" />
                    </div>
                    <div className="w-20">
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Валюта</label>
                      <select value={formData.currency} onChange={f => setFormData({...formData, currency: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50">
                        <option>$</option><option>€</option><option>TL</option><option>₽</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Город/Район *</label>
                    <input required minLength={3} type="text" placeholder="Напр: Гирне" value={formData.location} onChange={f => setFormData({...formData, location: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Страна</label>
                    <select value={formData.country} onChange={f => setFormData({...formData, country: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50">
                      {countries.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Фото * (Загрузить)</label>
                      <div className="relative border border-dashed border-gray-300 rounded-xl p-1 hover:border-blue-400 transition-colors bg-gray-50/50 flex items-center min-h-[42px]">
                        {formData.image_url ? (
                           <div className="flex items-center w-full gap-2 px-2">
                              <div className="w-8 h-8 rounded-md bg-cover bg-center border shadow-sm" style={{backgroundImage: `url(${formData.image_url})`}}></div>
                              <span className="text-[10px] text-green-600 font-bold truncate flex-1">Готово! Загружено</span>
                              <button type="button" onClick={() => setFormData({...formData, image_url: ''})} className="text-red-500 text-[10px] font-bold hover:underline">X</button>
                           </div>
                        ) : isUploading ? (
                          <div className="w-full text-center text-xs text-blue-600 font-semibold animate-pulse">⏳ Загрузка...</div>
                        ) : (
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploading(true);
                              try {
                                const body = new FormData();
                                body.append('file', file);
                                const res = await fetch('/api/upload', { method: 'POST', body });
                                const data = await res.json();
                                if (data.success) {
                                  setFormData({...formData, image_url: data.url});
                                } else {
                                  alert('Ошибка загрузки фото');
                                }
                              } catch(err) { alert('Сетевая ошибка загрузки'); }
                              finally { setIsUploading(false); }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                        )}
                        {!formData.image_url && !isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center gap-1.5 pointer-events-none">
                            <span className="text-sm">📁</span>
                            <span className="text-xs font-medium text-gray-500">Выбрать файл</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">🎬 Видео YouTube (опционально)</label>
                      <input type="url" placeholder="Ссылка..." value={formData.video_url} onChange={f => setFormData({...formData, video_url: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Описание</label>
                    <textarea rows={3} placeholder="Детали товара..." value={formData.description} onChange={f => setFormData({...formData, description: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50 resize-none"></textarea>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Телефон / Контакт *</label>
                    <input required type="text" placeholder="+7..." value={formData.contact} onChange={f => setFormData({...formData, contact: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50" />
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all text-sm"
                  >
                    {isSubmitting ? 'Публикация...' : 'Опубликовать объявление'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setModalView('CHOICE')}
                    className="text-xs text-gray-400 font-semibold underline mt-1 text-center w-full"
                  >
                    Вернуться к выбору
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
