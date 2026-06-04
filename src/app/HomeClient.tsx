'use client';

import { Navbar } from '../components/Navbar';
import { CategoryGrid, resolveCategory, categories as globalCategories } from '../components/CategoryGrid';
import { translations, translateListingText, getListingSubcategory } from '../utils/translations';
import { BannerAd } from '../components/BannerAd';


import { useState, useEffect, Fragment, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Car, 
  Laptop, 
  Wrench, 
  Briefcase, 
  Sofa, 
  Shirt, 
  Package, 
  Megaphone, 
  Compass, 
  Image as ImageIcon 
} from 'lucide-react';


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
  source?: string;
  country?: string;
  is_priority?: boolean;
  is_vip?: boolean;
  vip_until?: string;
  contact?: string;
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


function formatAdsPlural(count: number, lang: string) {
  if (lang === 'tr') return `${count} ilan`;
  if (lang === 'en') return `${count} ad${count !== 1 ? 's' : ''}`;
  
  // Russian pluralization
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) {
    return `${count} объявлений`;
  }
  if (mod10 === 1) {
    return `${count} объявление`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} объявления`;
  }
  return `${count} объявлений`;
}

export default function HomeClient({ 
  initialListings = [], 
  initialNextCursor = null,
  initialStats = { countHour: 0, countDay: 0, countNineDays: 0, total: 0, categoryCounts: {} as Record<string, number> }
}: { 
  initialListings?: Listing[];
  initialNextCursor?: string | null;
  initialStats?: any;
}) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [loading, setLoading] = useState(initialListings.length === 0);
  const [selectedCountry, setSelectedCountry] = useState('Северный Кипр');
  const [lang, setLang] = useState<'ru' | 'en' | 'tr'>('ru');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'CHOICE' | 'TELEGRAM' | 'WEB'>('CHOICE');
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('pm_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Все');

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const nineDaysAgo = new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000);

  // Filter listings based on country for accurate stats
  const countryListings = listings.filter(l => (l.country || 'Северный Кипр').toLowerCase() === selectedCountry.toLowerCase());

  const [stats, setStats] = useState(initialStats);
  const [newsListings, setNewsListings] = useState<any[]>([]);

  const isStatsInitialized = useRef(false);

  useEffect(() => {
    // Fetch News always to keep them fresh
    fetch(`/api/news?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNewsListings(data.news);
        }
      })
      .catch(console.error);

    // Skip initial stats fetch if we already have it from SSR (default is 'Северный Кипр')
    if (!isStatsInitialized.current && selectedCountry === 'Северный Кипр') {
      isStatsInitialized.current = true;
      return;
    }

    fetch(`/api/stats?country=${encodeURIComponent(selectedCountry)}&t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch(console.error);
  }, [selectedCountry]);

  const isCountryInitialized = useRef(false);
  useEffect(() => {
    if (!isCountryInitialized.current) {
      isCountryInitialized.current = true;
      return;
    }
    setListings([]);
    setNextCursor(null);
    fetchListings(selectedCountry);
  }, [selectedCountry]);
  
  const { countHour, countDay, countNineDays } = stats;
  const [searchQuery, setSearchQuery] = useState('');
  
  const isSearchMounted = useRef(false);
  useEffect(() => {
    if (!isSearchMounted.current) {
      isSearchMounted.current = true;
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoadingMore(true);
      try {
        const queryStr = searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : '?limit=250';
        const countryParam = `&country=${encodeURIComponent(selectedCountry)}`;
        const res = await fetch(`/api/listings${queryStr}${countryParam}&t=${Date.now()}`);
        const data = await res.json();
        const fetched = data.listings || [];
        setListings(prev => {
          const map = new Map();
          fetched.forEach((item: any) => map.set(item.id, item));
          const merged = prev.map(p => map.has(p.id) ? { ...p, ...map.get(p.id) } : p);
          const newItems = fetched.filter((l: any) => !prev.some(p => p.id === l.id));
          return [...newItems, ...merged];
        });
        setNextCursor(data.nextCursor || null);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingMore(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCountry]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortMode, setSortMode] = useState<'default' | 'cheap' | 'expensive' | 'date'>('default');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Smart Filters
  const [filterCity, setFilterCity] = useState('Все');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterPropertyType, setFilterPropertyType] = useState('Все');
  const [filterMinYear, setFilterMinYear] = useState('');
  
  // New Smart Filters
  const [filterDealType, setFilterDealType] = useState<'Все' | 'rent' | 'sale'>('Все');
  const [filterPropertyPlans, setFilterPropertyPlans] = useState<string[]>([]);
  const [filterMaxMileage, setFilterMaxMileage] = useState('');
  const [onlyOfficial, setOnlyOfficial] = useState(false);
  const [onlyWithPrice, setOnlyWithPrice] = useState(false);
  const [nearMeLoading, setNearMeLoading] = useState(false);
  
  useEffect(() => {
    setFilterCity('Все');
    setFilterDealType('Все');
    setFilterPropertyPlans([]);
    setFilterMinYear('');
    setFilterMaxMileage('');
    setOnlyOfficial(false);
    setOnlyWithPrice(false);
  }, [selectedCountry]);

  const getCitiesForCountry = () => {
    const predefined: Record<string, { value: string; label: string }[]> = {
      "Северный Кипр": [
        { value: "гирне", label: "Гирне (Kyrenia)" },
        { value: "искеле", label: "Искеле (Iskele)" },
        { value: "фамагуста", label: "Фамагуста (Gazimağusa)" },
        { value: "никосия", label: "Никосия (Lefkoşa)" },
        { value: "гюзельюрт", label: "Гюзельюрт (Güzelyurt)" },
        { value: "лефке", label: "Лефке (Lefke)" }
      ],
      "Республика Кипр": [
        { value: "лимасол", label: "Лимасол (Limassol)" },
        { value: "ларнака", label: "Ларнака (Larnaca)" },
        { value: "пафос", label: "Пафос (Paphos)" },
        { value: "айя-напа", label: "Айя-Напа (Ayia Napa)" },
        { value: "протарас", label: "Протарас (Protaras)" },
        { value: "никосия", label: "Никосия (Nicosia)" }
      ],
      "Турция": [
        { value: "стамбул", label: "Стамбул (Istanbul)" },
        { value: "анкара", label: "Анкара (Ankara)" },
        { value: "измир", label: "Измир (Izmir)" },
        { value: "анталия", label: "Анталия (Antalya)" },
        { value: "алания", label: "Алания (Alanya)" }
      ],
      "Россия": [
        { value: "москва", label: "Москва (Moscow)" },
        { value: "санкт-петербург", label: "Санкт-Петербург" },
        { value: "сочи", label: "Сочи (Sochi)" }
      ],
      "ОАЭ": [
        { value: "дубай", label: "Дубай (Dubai)" },
        { value: "абу-даби", label: "Абу-Даби (Abu Dhabi)" }
      ]
    };

    const countryWhitelists: Record<string, string[]> = {
      "Северный Кипр": [
        "гирне", "искеле", "фамагуста", "никосия", "гюзельюрт", "лефке",
        "лапта", "алсанджак", "эсентепе", "каршияка", "бафра", "чаталкой",
        "караоланолу", "беллапаис", "озанкой", "кирения", "скеле", "магуса",
        "лефкоша", "карпаз", "богаз", "татлису"
      ],
      "Республика Кипр": [
        "лимасол", "ларнака", "пафос", "айя-напа", "протарас", "никосия",
        "лимассол", "паралимни"
      ],
      "Турция": [
        "стамбул", "анкара", "измир", "анталия", "алания", "мерсин",
        "бодрум", "мармарис", "кемер", "фетхие"
      ],
      "Россия": [
        "москва", "санкт-петербург", "сочи", "краснодар", "казань"
      ],
      "ОАЭ": [
        "дубай", "абу-даби", "шарджа", "аджман"
      ]
    };

    const countryKey = Object.keys(predefined).find(
      k => k.toLowerCase() === selectedCountry.toLowerCase()
    );

    const list = countryKey ? [...predefined[countryKey]] : [];
    const whitelist = countryKey ? countryWhitelists[countryKey] : [];

    // Add any dynamic city from listings of this country, but only if it's whitelisted
    listings.forEach(l => {
      if ((l.country || 'Северный Кипр').toLowerCase() === selectedCountry.toLowerCase() && l.location) {
        const cityName = l.location.split(' ')[0].replace(/[,()]/g, '').trim();
        if (cityName && cityName !== "Не" && cityName !== "указана") {
          const val = cityName.toLowerCase();
          if (whitelist.includes(val)) {
            if (!list.some(item => item.value === val)) {
              list.push({ value: val, label: cityName });
            }
          }
        }
      }
    });

    return list;
  };
  
  // INFINITE SCROLL
  const [visibleCount, setVisibleCount] = useState(100);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const renderSuperVipCard = () => {
    const titles = {
      ru: "Ваше объявление всегда на первом месте!",
      en: "Your listing always at the very top!",
      tr: "İlanınız her zaman en başta!"
    };
    const descs = {
      ru: "Максимальные просмотры и мгновенный контакт. Закреп на сайте и в топе официального канала.",
      en: "Maximum exposure and instant customer response. Pinned on the site and in the official channel top.",
      tr: "Maksimum görünürlük ve anında müşteri dönüşü. Sitede ve resmi kanalda en üstте sabitleme."
    };
    const buttons = {
      ru: "Купить Закреп",
      en: "Get Pinned Slot",
      tr: "Sabitleme Satın Al"
    };
    const badge = {
      ru: "СУПЕР ВИП ЗАКРЕП",
      en: "SUPER VIP PIN",
      tr: "SÜPER VİP SABİTLEME"
    };
    const tariff = {
      ru: "неделя",
      en: "week",
      tr: "hafta"
    };
    
    return (
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 shadow-xl border border-indigo-500/30 flex flex-col justify-between p-4 sm:p-5 group transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-1 h-full min-h-[340px] sm:min-h-[380px]">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-60 pointer-events-none group-hover:opacity-80 transition-all duration-700" />
        
        <div className="flex flex-col gap-2.5 z-10 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-blue-950 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse">
              <span>👑</span>
              <span>{badge[lang]}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shrink-0">
              <span className="text-white text-xs sm:text-sm font-black tracking-tight">180 ★ <span className="text-[9px] sm:text-[10px] font-normal text-slate-300">/{tariff[lang]}</span></span>
            </div>
          </div>
        </div>
  
        <div className="z-10 mt-3">
          <h3 className="text-sm sm:text-base font-black text-white leading-snug group-hover:text-amber-300 transition-colors line-clamp-2">
            {titles[lang]}
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-300 font-medium mt-1.5 leading-normal line-clamp-3 sm:line-clamp-4">
            {descs[lang]}
          </p>
        </div>
  
        <div className="z-10 mt-3 pt-2">
          <a 
            href="https://t.me/BotHelpG_bot?start=super_vip"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-yellow-400 hover:to-amber-500 text-blue-950 text-xs font-black py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 text-center"
          >
            <span>{buttons[lang]}</span>
            <span>🚀</span>
          </a>
        </div>
      </div>
    );
  };
  
  const renderVoicePromoCard = () => {
    const titles = {
      ru: "Мы первые в мире! 🌍",
      en: "First in the world! 🌍",
      tr: "Dünyada ilk! 🌍"
    };
    const descs = {
      ru: "Достаточно одного голосового сообщения! Надиктуйте боту объявление или вопрос, и ИИ всё сделает сам за секунду.",
      en: "One voice message is enough! Dictate your ad or question, and AI will do everything in a second.",
      tr: "Tek bir sesli mesaj yeterli! İlanınızı veya sorunuzu dikte edin, yapay zeka her şeyi saniyeler içinde yapsın."
    };
    const buttons = {
      ru: "Отправить Голосовое",
      en: "Send Voice Message",
      tr: "Sesli Mesaj Gönder"
    };
    const badge = {
      ru: "ИИ АССИСТЕНТ 24/7",
      en: "AI ASSISTANT 24/7",
      tr: "YAPAY ZEKA ASİSTAN 24/7"
    };
    
    return (
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 shadow-xl border border-purple-500/30 flex flex-col justify-between p-4 sm:p-5 group transition-all duration-300 hover:shadow-purple-500/20 hover:-translate-y-1 h-full min-h-[340px] sm:min-h-[380px]">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-60 pointer-events-none group-hover:opacity-80 transition-all duration-700" />
        
        <div className="flex flex-col gap-2.5 z-10 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="bg-gradient-to-r from-purple-400 to-pink-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse">
              <span>🎙️</span>
              <span>{badge[lang]}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shrink-0">
              <span className="text-white text-xs sm:text-sm font-black tracking-tight">FREE</span>
            </div>
          </div>
        </div>
  
        <div className="z-10 mt-3">
          <h3 className="text-sm sm:text-base font-black text-white leading-snug group-hover:text-purple-300 transition-colors line-clamp-2">
            {titles[lang]}
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-300 font-medium mt-1.5 leading-normal line-clamp-3 sm:line-clamp-4">
            {descs[lang]}
          </p>
        </div>
  
        <div className="z-10 mt-3 pt-2">
          <a 
            href="https://t.me/BotHelpG_bot?start=voice"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 text-center"
          >
            <span>{buttons[lang]}</span>
            <span>🚀</span>
          </a>
        </div>
      </div>
    );
  };
  
  const renderPriorityCard = () => {
    const titles = {
      ru: "Выделитесь среди сотен объявлений!",
      en: "Stand out from hundreds of listings!",
      tr: "Yüzlerce ilan arasından öne çıkın!"
    };
    const descs = {
      ru: "Разместитесь в начале ленты над обычными группами. В 5 раз больше откликов, просмотров и быстрых продаж.",
      en: "Get placed at the start of the feed above regular groups. 5x more clicks, views, and faster sales.",
      tr: "Normal grupların üzerinde, akışın en başında yer alın. 5 kat daha fazla tıklama ve hızlı satış."
    };
    const buttons = {
      ru: "Подключить Приоритет",
      en: "Get Priority Listing",
      tr: "Öncelik Etkinleştir"
    };
    const badge = {
      ru: "ПРИОРИТЕТ В ЛЕНТЕ",
      en: "PRIORITY LISTING",
      tr: "ÖNCELİKLİ İLAN"
    };
    const tariff = {
      ru: "неделя",
      en: "week",
      tr: "hafta"
    };
    
    return (
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 shadow-xl border border-purple-500/30 flex flex-col justify-between p-4 sm:p-5 group transition-all duration-300 hover:shadow-purple-500/10 hover:-translate-y-1 h-full min-h-[340px] sm:min-h-[380px]">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-60 pointer-events-none group-hover:opacity-80 transition-all duration-700" />
        
        <div className="flex flex-col gap-2.5 z-10 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-lg flex items-center gap-1 shrink-0">
              <span>⚡</span>
              <span>{badge[lang]}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shrink-0">
              <span className="text-white text-xs sm:text-sm font-black tracking-tight">99 ★ <span className="text-[9px] sm:text-[10px] font-normal text-slate-300">/{tariff[lang]}</span></span>
            </div>
          </div>
        </div>
  
        <div className="z-10 mt-3">
          <h3 className="text-sm sm:text-base font-black text-white leading-snug group-hover:text-purple-300 transition-colors line-clamp-2">
            {titles[lang]}
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-300 font-medium mt-1.5 leading-normal line-clamp-3 sm:line-clamp-4">
            {descs[lang]}
          </p>
        </div>
  
        <div className="z-10 mt-3 pt-2">
          <a 
            href="https://t.me/BotHelpG_bot?start=priority"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-indigo-500 hover:to-purple-600 text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 text-center"
          >
            <span>{buttons[lang]}</span>
            <span>🔥</span>
          </a>
        </div>
      </div>
    );
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    const favs = JSON.parse(localStorage.getItem('pm_favorites') || '[]');
    let updated: string[] = [];
    if (favs.includes(id)) {
      updated = favs.filter((f: string) => f !== id);
    } else {
      updated = [...favs, id];
    }
    localStorage.setItem('pm_favorites', JSON.stringify(updated));
    setFavorites(updated);
  };

  const handleNearMeClick = () => {
    if (filterCity !== 'Все') {
      setFilterCity('Все');
      return;
    }
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert(lang === 'ru' ? 'Геолокация не поддерживается вашим браузером' : 'Geolocation is not supported by your browser');
      return;
    }
    setNearMeLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const cityCoords: Record<string, { lat: number; lon: number; label: string }> = {
          "гирне": { lat: 35.34, lon: 33.32, label: "гирне" },
          "искеле": { lat: 35.29, lon: 33.89, label: "искеле" },
          "фамагуста": { lat: 35.12, lon: 33.93, label: "фамагуста" },
          "никосия": { lat: 35.17, lon: 33.36, label: "никосия" },
          "гюзельюрт": { lat: 35.20, lon: 33.00, label: "гюзельюрт" },
          "лефке": { lat: 35.11, lon: 32.85, label: "лефке" }
        };
        
        let closestCity = "гирне";
        let minDistance = Infinity;
        
        for (const [cityName, coords] of Object.entries(cityCoords)) {
          const d = Math.sqrt(Math.pow(latitude - coords.lat, 2) + Math.pow(longitude - coords.lon, 2));
          if (d < minDistance) {
            minDistance = d;
            closestCity = cityName;
          }
        }
        
        if (minDistance < 1.5) {
          setFilterCity(closestCity);
        } else {
          alert(lang === 'ru' ? 'Вы находитесь слишком далеко от Кипра. Выбран город по умолчанию (Гирне).' : 'You are too far from Cyprus. Defaulting to Girne.');
          setFilterCity('гирне');
        }
        setNearMeLoading(false);
      },
      (error) => {
        console.error(error);
        alert(lang === 'ru' ? 'Не удалось определить геолокацию. Убедитесь, что доступ разрешен.' : 'Could not get geolocation. Please check permissions.');
        setNearMeLoading(false);
      },
      { timeout: 10000 }
    );
  };
  
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
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  async function fetchListings(countryToFetch = selectedCountry) {
    if (listings.length === 0) {
      setLoading(true);
    }
    try {
      const res = await fetch(`/api/listings?limit=250&country=${encodeURIComponent(countryToFetch)}&t=${Date.now()}`);
      const data = await res.json();
      const fetched = data.listings || data;
      setListings(prev => {
        const map = new Map();
        fetched.forEach((item: any) => map.set(item.id, item));
        const merged = prev.map(p => map.has(p.id) ? { ...p, ...map.get(p.id) } : p);
        const newItems = fetched.filter((l: any) => !prev.some(p => p.id === l.id));
        return [...newItems, ...merged];
      });
      setNextCursor(data.nextCursor || null);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  }

  const loadMoreListings = useCallback(async () => {
    if (isLoadingMore || !nextCursor) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/listings?limit=100&cursor=${nextCursor}&country=${encodeURIComponent(selectedCountry)}&t=${Date.now()}`);
      const data = await res.json();
      if (data.listings && data.listings.length > 0) {
        setListings(prev => {
          const newItems = data.listings.filter((l: any) => !prev.find((p: any) => p.id === l.id));
          return [...prev, ...newItems];
        });
        setNextCursor(data.nextCursor || null);
      } else {
        setNextCursor(null);
      }
    } catch (error) {
      console.error('Failed to load more listings:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, selectedCountry]);

  const handlePublishCtaClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setModalView('CHOICE');
    setIsModalOpen(true);
  };

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'tr') setLang('tr');
    else if (browserLang === 'en') setLang('en');
    else setLang('ru');

    // Initialize Theme
    const storedTheme = localStorage.getItem('pm_theme') || 'dark';
    setTheme(storedTheme as 'light' | 'dark');
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    let storedUser = localStorage.getItem('pulse_user');
    if (!storedUser) {
      const match = document.cookie.match(/(^| )pulse_user=([^;]+)/);
      if (match) {
        try {
          storedUser = decodeURIComponent(match[2]);
          localStorage.setItem('pulse_user', storedUser);
        } catch (e) {}
      }
    }

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch(e) {}
    }
    setIsAuthChecking(false);

    if (typeof window !== 'undefined') {
      const favs = JSON.parse(localStorage.getItem('pm_favorites') || '[]');
      setFavorites(favs);
    }

    if (initialListings.length === 0) {
      fetchListings();
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 100);
        if (nextCursor && !isLoadingMore) {
          loadMoreListings();
        }
      }
    }, { threshold: 0.1 });
    
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [nextCursor, isLoadingMore, loadMoreListings]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('pm_welcome_dismissed')) {
      setShowWelcome(true);
    }
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    if (typeof window !== 'undefined') localStorage.setItem('pm_welcome_dismissed', '1');
  };

  const t = translations[lang];

  const categories = [
    { id: 'Все', name: lang === 'ru' ? 'Все' : lang === 'tr' ? 'Hepsi' : 'All', icon: '🏠' },
    { id: 'Недвижимость', name: lang === 'ru' ? 'Недвижимость' : lang === 'tr' ? 'Emlak' : 'Real Estate', icon: '🏘️' },
    { id: 'Транспорт', name: lang === 'ru' ? 'Транспорт' : lang === 'tr' ? 'Vasıta' : 'Transport', icon: '🚗' },
    { id: 'Электроника', name: lang === 'ru' ? 'Электроника' : lang === 'tr' ? 'Elektronik' : 'Electronics', icon: '💻' },
    { id: 'Услуги', name: lang === 'ru' ? 'Услуги' : lang === 'tr' ? 'Hizmetler' : 'Services', icon: '🛠️' },
    { id: 'Работа', name: lang === 'ru' ? 'Работа' : lang === 'tr' ? 'İş' : 'Jobs', icon: '💼' },
    { id: '🔍 Спрос', name: lang === 'ru' ? 'Спрос/Поиск' : lang === 'tr' ? 'Aranıyor' : 'Demand', icon: '🔍' },
    { id: 'Мебель', name: lang === 'ru' ? 'Мебель' : lang === 'tr' ? 'Mobilya' : 'Furniture', icon: '🛋️' },
    { id: 'Одежда', name: lang === 'ru' ? 'Одежда' : lang === 'tr' ? 'Giyim' : 'Clothing', icon: '👕' },
    { id: 'Разное', name: lang === 'ru' ? 'Разное' : lang === 'tr' ? 'Diğer' : 'Misc', icon: '📦' },
    { id: 'Новости', name: lang === 'ru' ? 'Новости' : lang === 'tr' ? 'Haberler' : 'News', icon: '📢' },
  ];

  const countryFlags: { [key: string]: { flag: string; code: string } } = {
    'Северный Кипр': { flag: '🏝️', code: 'TRNC' },
    'Республика Кипр': { flag: '🇨🇾', code: 'CY' },
    'Турция': { flag: '🇹🇷', code: 'TR' },
    'Россия': { flag: '🇷🇺', code: 'RU' },
    'ОАЭ': { flag: '🇦🇪', code: 'UAE' },
    'Испания': { flag: '🇪🇸', code: 'ES' },
    'Таиланд': { flag: '🇹🇭', code: 'TH' },
    'Грузия': { flag: '🇬🇪', code: 'GE' },
    'Казахстан': { flag: '🇰🇿', code: 'KZ' }
  };

  const activeCountriesSet = new Set<string>();
  activeCountriesSet.add('Северный Кипр');
  activeCountriesSet.add('Республика Кипр');
  activeCountriesSet.add('Турция');
  activeCountriesSet.add('Россия');
  activeCountriesSet.add('ОАЭ');
  activeCountriesSet.add('Испания');

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

      <Navbar 
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
        countries={countries}
        t={t}
        lang={lang}
        setLang={setLang}
        theme={theme}
        toggleTheme={toggleTheme}
        isAuthChecking={isAuthChecking}
        currentUser={currentUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
        favoritesCount={favorites.length}
      />
      <CategoryGrid 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSubcategory={selectedSubcategory}
        setSelectedSubcategory={setSelectedSubcategory}
        listings={listings}
        selectedCountry={selectedCountry}
        lang={lang}
        getListingSubcategory={getListingSubcategory}
        categoryCounts={stats.categoryCounts}
      />


      {/* PREMIUM CTA BANNER A */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-indigo-400/30 overflow-hidden group flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-blue-500/20 transition-all duration-300">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0)_0%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0)_100%)] -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
          
          <div className="flex items-center gap-5 z-10 text-left">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shadow-inner shadow-white/20 select-none transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
              📣
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight">
                {lang === 'ru' ? '🤔 Устали раскидывать тексты по чатам, где их никто не читает?' 
                  : lang === 'tr' ? 'İlanın listede yok mu?' 
                  : 'Is your ad missing from the list?'}
              </h2>
              <p className="text-sm text-indigo-100 font-medium mt-1.5 opacity-90 max-w-2xl leading-relaxed">
                {lang === 'ru' ? 'Ваше объявление не должно тонуть в спаме. Опубликуйте его здесь прямо сейчас (это абсолютно бесплатно). Всего 1 минута, и ваше предложение появится на экранах людей, которые ищут именно этот товар, а не листают информационный мусор.' 
                  : lang === 'tr' ? 'Hemen şimdi ücretsiz yayınla! Sadece 1 dakikanı alır ve binlerce müşteriye ulaşır.' 
                  : 'Publish it right now for free! It takes just 1 minute and connects you with thousands of buyers.'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handlePublishCtaClick}
            className="shrink-0 relative z-10 bg-white text-blue-700 px-8 py-4 rounded-2xl font-black text-base shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-white/30 transition-all duration-300 flex items-center gap-3 border-2 border-transparent group/btn"
          >
            <span>{lang === 'ru' ? '🚀 Опубликовать и получить отклики' : lang === 'tr' ? 'İlan Yayınla' : 'Post Listing'}</span>
            <svg className="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Premium AI Automation & Safety Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-6">
        <div className="glass-card rounded-[2rem] p-8 md:p-10 shadow-2xl flex flex-col lg:flex-row items-stretch gap-10 relative overflow-hidden group">
          {/* Animated Background Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px] -z-10 transform translate-x-1/3 -translate-y-1/3 group-hover:bg-blue-500/40 transition-colors duration-700"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] -z-10 transform -translate-x-1/3 translate-y-1/3 group-hover:bg-indigo-500/30 transition-colors duration-700"></div>
          
          <div className="flex-1 flex flex-col justify-center relative z-10">
            <div className="inline-flex items-center gap-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase w-fit mb-6 border border-blue-200 dark:border-blue-500/30 shadow-inner backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              {lang === 'ru' ? 'Вам больше не нужно пролистывать 50+ чатов вручную' : lang === 'tr' ? 'Akıllı Piyasa Taraması' : 'Smart Market Scraper'}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight drop-shadow-lg">
              {lang === 'ru' ? (
                <>Наш ИИ-модератор <br className="hidden md:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">круглосуточно сканирует</span><br className="hidden md:block" /> крупнейшие группы</>
              ) : lang === 'tr' ? (
                <>Zaman Tasarrufu <br className="hidden md:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">ve Güvenlik</span> 🛡️</>
              ) : (
                <>Save Time <br className="hidden md:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">& Stay Safe</span> 🛡️</>
              )}
            </h2>
            <p className="mt-5 text-lg text-gray-800 dark:text-blue-100/80 font-medium leading-relaxed max-w-xl">
              {lang === 'ru' 
                ? 'Мы собрали весь рынок в одну ленту, чтобы вы экономили часы времени каждый день и видели только проверенные предложения.' 
                : lang === 'tr' 
                ? 'Yapay zeka moderatörümüz sizin için düzinelerce grubu 7/24 izler, yalnızca temiz ve doğrulanmış teklifleri yayınlar.' 
                : 'Our AI moderator monitors dozens of active channels for you 24/7, publishing only verified, clean offers.'}
            </p>
          </div>

          <div className="flex-[1.4] grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
            {/* Card 1: No Spam */}
            <div className="glass-nav border border-gray-200 dark:border-white/10 p-6 rounded-2xl flex flex-col gap-4 hover:-translate-y-1.5 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300 group/card">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl flex items-center justify-center text-2xl shadow-inner group-hover/card:scale-110 transition-transform">
                🚫
              </div>
              <div>
                <h4 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                  {lang === 'ru' ? 'Никаких скрытых цен и мошенников' : lang === 'tr' ? 'Çöp ve Spam Yok' : 'No Trash or Spam'}
                </h4>
                <p className="text-sm text-gray-800 dark:text-blue-100/60 font-medium mt-2 leading-relaxed">
                  {lang === 'ru' 
                    ? 'Устали от фраз «цена в личку»? Наш алгоритм автоматически блокирует любые объявления без указания стоимости или со скрытым продавцом. Ваша безопасность и прозрачность сделки — наш приоритет.' 
                    : lang === 'tr' 
                    ? 'Fiyatı bulunmayan veya satıcı adı gizli olan ilanlar güvenliğiniz için engellenir!' 
                    : 'Listings without a price or with hidden seller profiles are automatically blocked for your safety!'}
                </p>
              </div>
            </div>

            {/* Card 2: Freshness */}
            <div className="glass-nav border border-gray-200 dark:border-white/10 p-6 rounded-2xl flex flex-col gap-4 hover:-translate-y-1.5 hover:border-orange-500/40 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] transition-all duration-300 group/card mt-0 sm:mt-8">
              <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 rounded-xl flex items-center justify-center text-2xl shadow-inner group-hover/card:scale-110 transition-transform">
                ⏳
              </div>
              <div>
                <h4 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                  {lang === 'ru' ? 'Вы не позвоните по давно проданному объекту' : lang === 'tr' ? '9 Günlük Güncellik' : '9-Day Freshness'}
                </h4>
                <p className="text-sm text-gray-700 dark:text-blue-100/60 font-medium mt-2 leading-relaxed">
                  {lang === 'ru' 
                    ? 'Информационный мусор и старые объявления искажают рынок. Наша система автоматически удаляет все посты старше 9 дней. Вы работаете только с живым, свежим и актуальным рынком.' 
                    : lang === 'tr' 
                    ? '9 günden eski olan tüm ilanlar ve haberler otomatik olarak silinir. Canlı piyasayı görürsünüz!' 
                    : 'All postings and news older than 9 days are purged automatically. You see a fresh market!'}
                </p>
              </div>
            </div>

            {/* Card 3: Always on Top */}
            <div className="glass-nav border border-gray-200 dark:border-white/10 p-6 rounded-2xl flex flex-col gap-4 hover:-translate-y-1.5 hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300 group/card sm:-mt-8">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-xl flex items-center justify-center text-2xl shadow-inner group-hover/card:scale-110 transition-transform">
                👑
              </div>
              <div>
                <h4 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                  {lang === 'ru' ? (
                    <>Золотой стандарт надежности от <a href="https://t.me/NorthCyprus_Island" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@NorthCyprus_Island</a></>
                  ) : lang === 'tr' ? (
                    'Her Zaman Üstte'
                  ) : (
                    'Always on Top'
                  )}
                </h4>
                <p className="text-sm text-gray-800 dark:text-blue-100/60 font-medium mt-2 leading-relaxed">
                  {lang === 'ru' ? (
                    <>Самые важные, проверенные и официальные объявления от нашего главного канала автоматически закрепляются в топе сайта. Вы никогда не пропустите эксклюзивные предложения.</>
                  ) : lang === 'tr' ? (
                    <>Resmi <a href="https://t.me/NorthCyprus_Island" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold">@NorthCyprus_Island</a> kanalındaki tüm ilanlar otomatik olarak listenin en üstünde yer alır!</>
                  ) : (
                    <>All listings from the official <a href="https://t.me/NorthCyprus_Island" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold">@NorthCyprus_Island</a> channel are automatically pinned at the top!</>
                  )}
                </p>
              </div>
            </div>
            {/* Card 4: Auto Translation */}
            <div className="glass-nav border border-gray-200 dark:border-white/10 p-6 rounded-2xl flex flex-col gap-4 hover:-translate-y-1.5 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300 group/card sm:-mt-8">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-black shadow-inner group-hover/card:scale-110 transition-transform">
                🇹🇷🇬🇧🇷🇺
              </div>
              <div>
                <h4 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                  {lang === 'ru' ? 'Нейро-перевод всех объявлений' : lang === 'tr' ? 'Tüm ilanların AI çevirisi' : 'AI Translation for all listings'}
                </h4>
                <p className="text-sm text-gray-800 dark:text-blue-100/60 font-medium mt-2 leading-relaxed">
                  {lang === 'ru' 
                    ? 'Сайт автоматически переводит все объявления на ваш язык (Русский, English, Türkçe). Покупайте и продавайте без языковых барьеров!' 
                    : lang === 'tr' 
                    ? 'Site tüm ilanları otomatik olarak dilinize (Türkçe, English, Русский) çevirir. Dil engeli olmadan alıp satın!' 
                    : 'The site automatically translates all listings into your language (English, Türkçe, Русский). Buy and sell without language barriers!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SaaS Alert Subscription Premium Banner (VIP RADAR) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <Link 
          href="https://t.me/BotHelpG_bot?start=alerts"
          target="_blank"
          rel="noopener noreferrer"
          className="group block w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white p-5 rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-3xl animate-pulse group-hover:animate-none">
                🔔
              </div>
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  {lang === 'ru' ? 'Перехватывайте лучшие товары первыми' : lang === 'tr' ? 'Telegram Anında Bildirimler' : 'Instant Telegram Notifications'}
                  <span className="bg-yellow-400 text-blue-950 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider animate-bounce group-hover:animate-none shadow-sm">VIP</span>
                </h3>
                <p className="text-sm text-blue-100 font-medium mt-0.5">
                  {lang === 'ru' ? 'Устали видеть надпись «Уже продано»? Пока остальные часами листают ленту в надежде на удачу, вы получаете уведомление в ту же секунду, как нужная вещь появилась в продаже. Настройте фильтр под себя (только ваши размеры, цены и бренды) и забирайте эксклюзив до того, как его увидят другие.' 
                   : lang === 'tr' ? 'İlanları gerçek zamanlı takip edin! Gelişmiş filtreler aktivasyondan sonra kullanılabilir.' 
                   : 'Track listings in real-time! Custom smart filters are unlocked after activation.'}
                </p>
              </div>
            </div>
            <div className="shrink-0 bg-white text-blue-700 px-6 py-3 rounded-xl font-black text-sm group-hover:bg-blue-50 transition-all shadow-md flex items-center gap-2">
              {lang === 'ru' ? 'включить за 99 звёзд в месяц!!!' : lang === 'tr' ? 'Ayda 99 Yıldız İле Başlat' : 'Enable for 99 Stars / Month'}
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          {/* Breadcrumb Path */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
            <button onClick={() => { setSelectedCategory('Все'); setSelectedSubcategory('Все'); setSearchQuery(''); setShowFavoritesOnly(false); }} className="hover:text-blue-600 transition-colors font-medium">
              🏠 {lang === 'ru' ? 'Главная' : lang === 'tr' ? 'Ana Sayfa' : 'Home'}
            </button>
            {selectedCategory !== 'Все' && (
              <>
                <span className="text-gray-300">›</span>
                <button onClick={() => setSelectedSubcategory('Все')} className="hover:text-blue-600 transition-colors font-medium text-gray-700">
                  {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                </button>
              </>
            )}
            {selectedSubcategory !== 'Все' && (
              <>
                <span className="text-gray-300">›</span>
                <span className="text-gray-900 font-semibold">{selectedSubcategory}</span>
              </>
            )}
            {searchQuery && (
              <>
                <span className="text-gray-300">›</span>
                <span className="text-blue-600 font-semibold">«{searchQuery}»</span>
              </>
            )}
          </nav>

          {/* Title Row with Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="sr-only">PulseMarket — Крупнейший маркетплейс Северного Кипра. Недвижимость, Авто, Услуги</h1>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">{t.title}</h2>
              <p className="text-gray-500 text-sm">{t.subtitle} {selectedCountry}</p>
            </div>
            <div className="flex gap-4 items-center shrink-0">
              <span className="text-sm font-medium text-gray-400">{t.sort}</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
                aria-label="Sort options"
                className="bg-transparent border-none text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer p-0"
              >
                <option value="default">{t.sortDefault}</option>
                <option value="cheap">{t.sortCheap}</option>
                <option value="expensive">{t.sortExp}</option>
                <option value="date">{t.sortDate}</option>
              </select>
            </div>
          </div>

          {/* Active Filters Strip */}
          {(selectedCategory !== 'Все' || selectedSubcategory !== 'Все' || searchQuery || showFavoritesOnly || selectedCountry !== 'Северный Кипр') && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
                {lang === 'ru' ? 'Фильтры:' : lang === 'tr' ? 'Filtreler:' : 'Filters:'}
              </span>
              {selectedCountry !== 'Северный Кипр' && (
                <button onClick={() => setSelectedCountry('Северный Кипр')} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors group">
                  📍 {selectedCountry}
                  <span className="text-blue-400 group-hover:text-red-500 transition-colors">✕</span>
                </button>
              )}
              {selectedCategory !== 'Все' && (
                <button onClick={() => { setSelectedCategory('Все'); setSelectedSubcategory('Все'); }} className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors group">
                  {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                  <span className="text-indigo-400 group-hover:text-red-500 transition-colors">✕</span>
                </button>
              )}
              {selectedSubcategory !== 'Все' && (
                <button onClick={() => setSelectedSubcategory('Все')} className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors group">
                  {selectedSubcategory}
                  <span className="text-purple-400 group-hover:text-red-500 transition-colors">✕</span>
                </button>
              )}
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-100 hover:bg-amber-100 transition-colors group">
                  🔍 «{searchQuery}»
                  <span className="text-amber-400 group-hover:text-red-500 transition-colors">✕</span>
                </button>
              )}
              {showFavoritesOnly && (
                <button onClick={() => setShowFavoritesOnly(false)} className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full border border-red-100 hover:bg-red-100 transition-colors group">
                  ❤️ {lang === 'ru' ? 'Избранное' : 'Favorites'}
                  <span className="text-red-400 group-hover:text-red-600 transition-colors">✕</span>
                </button>
              )}
              <button
                onClick={() => { 
                  setSelectedCategory('Все'); 
                  setSelectedSubcategory('Все'); 
                  setSearchQuery(''); 
                  setShowFavoritesOnly(false); 
                  setSelectedCountry('Северный Кипр');
                  setFilterCity('Все');
                  setFilterMinPrice('');
                  setFilterMaxPrice('');
                  setFilterDealType('Все');
                  setFilterPropertyPlans([]);
                  setFilterMinYear('');
                  setFilterMaxMileage('');
                  setOnlyOfficial(false);
                  setOnlyWithPrice(false);
                }}
                className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2 ml-1"
              >
                {lang === 'ru' ? 'Сбросить всё' : lang === 'tr' ? 'Hepsini sıfırla' : 'Clear all'}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="glass-card h-[380px] animate-pulse"></div>
            ))}
          </div>
        ) : (() => {
          const filteredByCountry = listings.filter(item => {
            const itemCountry = item.country || 'Северный Кипр';
            const matchesCountry = itemCountry.toLowerCase() === selectedCountry.toLowerCase();
            
            const matchesSearch = searchQuery 
              ? (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                 item.location.toLowerCase().includes(searchQuery.toLowerCase()))
              : true;
              
            const matchesCategory = selectedCategory === 'Все' 
              ? true 
              : resolveCategory(item.category) === selectedCategory;

            const isSubcategoryTracked = selectedCategory === 'Недвижимость' || selectedCategory === 'Транспорт';
            const matchesSubcategory = (isSubcategoryTracked && selectedSubcategory !== 'Все')
              ? getListingSubcategory(item.title, item.description, item.category, Number(item.price || 0)) === selectedSubcategory
              : true;

            const matchesFavorites = showFavoritesOnly ? favorites.includes(item.id) : true;

            const loc = getTranslatedField(item, 'location', 'ru').toLowerCase();
            const matchesCity = filterCity === 'Все' ? true : loc.includes(filterCity.toLowerCase());
            
            const itemPrice = Number(item.price || 0);
            const matchesMinPrice = filterMinPrice ? itemPrice >= Number(filterMinPrice) : true;
            const matchesMaxPrice = filterMaxPrice ? itemPrice <= Number(filterMaxPrice) : true;

            const t_ru = getTranslatedField(item, 'title', 'ru').toLowerCase();
            const d_ru = getTranslatedField(item, 'description', 'ru').toLowerCase();

            // Deal Type filter (rent/sale)
            const matchesDealType = filterDealType === 'Все' ? true : (() => {
              const type = (item.type || '').toLowerCase();
              const fullText = `${t_ru} ${d_ru}`;
              if (filterDealType === 'rent') {
                return type === 'аренда' || type === 'rent' || fullText.includes('аренда') || fullText.includes('сдам') || fullText.includes('сдаю') || fullText.includes('rent') || fullText.includes('посуточно');
              }
              if (filterDealType === 'sale') {
                return type === 'продажа' || type === 'sale' || fullText.includes('продажа') || fullText.includes('продам') || fullText.includes('продаю') || fullText.includes('sale') || fullText.includes('купить');
              }
              return true;
            })();

            // Property plans filter (studio, 1+1, 2+1, 3+1, 4+)
            const matchesPropertyPlan = filterPropertyPlans.length === 0 ? true : (() => {
              const rooms = (item.metadata?.rooms || '').toLowerCase();
              const fullText = `${t_ru} ${d_ru} ${rooms}`;
              return filterPropertyPlans.some(plan => {
                if (plan === 'studio') {
                  return fullText.includes('студия') || fullText.includes('studio') || rooms === 'studio';
                }
                if (plan === '4+') {
                  return /\b[4-9]\+\d\b/.test(fullText) || fullText.includes('4 спальни') || fullText.includes('5 спален') || fullText.includes('4+') || (item.metadata?.rooms && parseInt(item.metadata.rooms) >= 4);
                }
                return fullText.includes(plan) || rooms.includes(plan);
              });
            })();

            const year = Number(item.metadata?.year || 0);
            const matchesYear = filterMinYear ? (year >= Number(filterMinYear)) : true;

            const mileage = Number(item.metadata?.mileage || 0);
            const matchesMileage = filterMaxMileage ? (mileage > 0 && mileage <= Number(filterMaxMileage)) : true;

            const src = String(item.source || '').toLowerCase();
            const isOfficial = src.includes('northcyprus_island') || src.includes('news_cyprus_north') || src.includes('личные сообщения боту') || item.is_vip;
            const matchesOfficial = onlyOfficial ? isOfficial : true;

            const matchesWithPrice = onlyWithPrice ? (itemPrice > 0) : true;

            return matchesCountry && matchesSearch && matchesCategory && matchesSubcategory && matchesFavorites && matchesCity && matchesMinPrice && matchesMaxPrice && matchesDealType && matchesPropertyPlan && matchesYear && matchesMileage && matchesOfficial && matchesWithPrice;
          });
          const SUPER_VIP_AD_1: Listing = {
            id: 'tg_150385_super_vip',
            title: 'Подготовка к школе и логопедия в Искеле',
            price: '0',
            currency: 'EUR',
            category: 'Услуги',
            location: 'Искеле',
            createdAt: '2026-06-03T17:00:00.000Z',
            username: '@KseniaBorodina',
            description: '🎓 Подарите вашему ребенку уверенный старт!\nПриглашаю малышей и дошкольников на комплексные индивидуальные занятия. Помогу освоить базовые навыки, полюбить учебу и научиться говорить правильно и красиво!\n\n📚 Обучение и подготовка:\n• Чтение: от изучения букв до беглого и осознанного чтения.\n• Письмо: правильная постановка руки и уверенные первые строчки.\n• Математика: увлекательное знакомство с цифрами, логикой и счетом.\n\n🗣 Логопедия и развитие речи:\n• Помогу вашему ребенку заговорить (бережный запуск речи).\n• Профессиональная постановка звуков и коррекция дикции.\n\n📍 Локация: Индивидуальные занятия в Искеле.\n\n👉 Запишитесь на первое занятие прямо сейчас и подарите своему ребенку уверенность в собственных силах!\n📩 Для записи и вопросов пишите @KseniaBorodina',
            image_url: 'https://i.ibb.co/PztD3VYF/0742848d8de6.jpg',
            source: 'Telegram (@northcyprus_island)',
            country: 'Северный Кипр',
            is_priority: true,
            metadata: { rooms: '' }
          };

          const SUPER_VIP_AD_2: Listing = {
            id: 'FPY37jBN5znxPfuN1FNt',
            title: 'Роскошная квартира в аренду',
            price: '140',
            currency: 'EUR',
            category: 'Недвижимость',
            location: 'Искеле',
            createdAt: '2026-05-21T14:34:52.974Z',
            username: '@Blesk_vbg',
            description: 'Роскошная квартира в аренду на курорте Grand Sapphire Resort в центре Iskele в Северном Кипре.\nВ квартире 1+2 две элегантные спальни, две ванные комнаты, просторная гостиная с кухней и просторная терраса на 5 этаже с впечатляющим видом на море.\n140 € за ночь+уборка Писать @Blesk_vbg',
            image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
            source: 'Telegram (@northcyprus_island)',
            country: 'Северный Кипр',
            is_priority: true,
            metadata: { rooms: '1+2' }
          };

          const matchVipAd = (item: Listing) => {
            const itemCountry = item.country || 'Северный Кипр';
            const matchesCountry = itemCountry.toLowerCase() === selectedCountry.toLowerCase();
            
            const matchesSearch = searchQuery 
              ? (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                 item.location.toLowerCase().includes(searchQuery.toLowerCase()))
              : true;
              
            const matchesCategory = selectedCategory === 'Все' 
              ? true 
              : resolveCategory(item.category) === selectedCategory;

            const matchesFavorites = showFavoritesOnly ? favorites.includes(item.id) : true;

            const loc = getTranslatedField(item, 'location', 'ru').toLowerCase();
            const matchesCity = filterCity === 'Все' ? true : loc.includes(filterCity.toLowerCase());
            
            const itemPrice = Number(item.price || 0);
            const matchesMinPrice = filterMinPrice ? itemPrice >= Number(filterMinPrice) : true;
            const matchesMaxPrice = filterMaxPrice ? itemPrice <= Number(filterMaxPrice) : true;

            const t_ru = getTranslatedField(item, 'title', 'ru').toLowerCase();
            const d_ru = getTranslatedField(item, 'description', 'ru').toLowerCase();

            // Deal Type filter (rent/sale)
            const matchesDealType = filterDealType === 'Все' ? true : (() => {
              const type = (item.type || '').toLowerCase();
              const fullText = `${t_ru} ${d_ru}`;
              if (filterDealType === 'rent') {
                return type === 'аренда' || type === 'rent' || fullText.includes('аренда') || fullText.includes('сдам') || fullText.includes('сдаю') || fullText.includes('rent') || fullText.includes('посуточно');
              }
              if (filterDealType === 'sale') {
                return type === 'продажа' || type === 'sale' || fullText.includes('продажа') || fullText.includes('продам') || fullText.includes('продаю') || fullText.includes('sale') || fullText.includes('купить');
              }
              return true;
            })();

            // Property plans filter (studio, 1+1, 2+1, 3+1, 4+)
            const matchesPropertyPlan = filterPropertyPlans.length === 0 ? true : (() => {
              const rooms = (item.metadata?.rooms || '').toLowerCase();
              const fullText = `${t_ru} ${d_ru} ${rooms}`;
              return filterPropertyPlans.some(plan => {
                if (plan === 'studio') {
                  return fullText.includes('студия') || fullText.includes('studio') || rooms === 'studio';
                }
                if (plan === '4+') {
                  return /\b[4-9]\+\d\b/.test(fullText) || fullText.includes('4 спальни') || fullText.includes('5 спален') || fullText.includes('4+') || (item.metadata?.rooms && parseInt(item.metadata.rooms) >= 4);
                }
                return fullText.includes(plan) || rooms.includes(plan);
              });
            })();

            const src = String(item.source || '').toLowerCase();
            const isOfficial = src.includes('northcyprus_island') || src.includes('news_cyprus_north') || src.includes('личные сообщения боту') || item.is_vip;
            const matchesOfficial = onlyOfficial ? isOfficial : true;

            const matchesWithPrice = onlyWithPrice ? (itemPrice > 0) : true;

            return matchesCountry && matchesSearch && matchesCategory && matchesFavorites && matchesCity && matchesMinPrice && matchesMaxPrice && matchesDealType && matchesPropertyPlan && matchesOfficial && matchesWithPrice;
          };

          const activeVipAds = [SUPER_VIP_AD_1, SUPER_VIP_AD_2].filter(matchVipAd);

          const rawMarketplaceListings = filteredByCountry
            .filter(item => selectedCategory === 'Новости' ? true : item.category !== 'Новости')
            .filter(item => item.id !== 'FPY37jBN5znxPfuN1FNt' && item.id !== 'tg_150385_super_vip') // Remove if it accidentally came from API
            .sort((a, b) => {
                // If custom sorting is selected, sort strictly by that mode
                if (sortMode === 'cheap') return Number(a.price || 0) - Number(b.price || 0);
                if (sortMode === 'expensive') return Number(b.price || 0) - Number(a.price || 0);
                if (sortMode === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

                // Otherwise, this is 'default' sort mode (Сначала свежие):
                const getScore = (listing: any) => {
                   const src = String(listing.source || '').toLowerCase();
                   const isSupreme = src.includes('northcyprus_island') || src.includes('news_cyprus_north');
                   
                   // Only apply priority boosts if the listing is from the last 72 hours
                   const isFresh = new Date().getTime() - new Date(listing.createdAt).getTime() < 72 * 60 * 60 * 1000;
                   
                   if (!isFresh) return 0; // Drop all priority boosts for older listings to keep the feed chronological
                   
                   if (listing.is_vip) return 20; // VIP PAID PLACEMENT ON TOP
                   if (isSupreme) return 15; // OFFICIAL CHANNELS SECOND
                   if (listing.is_priority) return 10; // PRIORITY THIRD
                   return 0;
                };
                
                const scoreA = getScore(a);
                const scoreB = getScore(b);
                
                if (scoreB !== scoreA) return scoreB - scoreA; 
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

          // Always inject VIP ads at the top!
          const marketplaceListings = [...activeVipAds, ...rawMarketplaceListings];

          const firstNonOfficialIndex = marketplaceListings.findIndex(
            (item, index) => index > 0 && !String(item.source || '').toLowerCase().includes('northcyprus_island')
          );
            
            // newsListings is fetched independently via API
          
          return (
            <div className="flex flex-col gap-6">
              {/* Поиск, Фильтры и Статистика */}
              <div className="flex flex-col gap-4 w-full">
                {/* Заголовок фильтров и Компактный метаблок статистики */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xl">🎛️</span>
                    <h3 className="font-black text-gray-900 dark:text-white">
                      {lang === 'ru' ? 'Фильтры' : lang === 'tr' ? 'Filtreler' : 'Filters'}
                    </h3>
                  </div>
                  
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-1.5 w-fit">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span>
                      {lang === 'ru' ? `${countDay} новых за 24 часа • ${stats.total} активных объявлений` 
                       : lang === 'tr' ? `24 saatte ${countDay} yeni • ${stats.total} aktif ilan` 
                       : `${countDay} new in 24h • ${stats.total} active ads`}
                    </span>
                  </div>
                </div>

                {/* Быстрые чип-фильтры */}
                <div className="flex flex-wrap gap-2.5">
                  <button 
                    onClick={() => setOnlyOfficial(!onlyOfficial)} 
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                      onlyOfficial 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' 
                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 dark:text-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10'
                    }`}
                  >
                    👑 {lang === 'ru' ? 'Только официальные' : lang === 'tr' ? 'Sadece resmi' : 'Only official'}
                  </button>
                  
                  <button 
                    onClick={() => setOnlyWithPrice(!onlyWithPrice)} 
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                      onlyWithPrice 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' 
                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 dark:text-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10'
                    }`}
                  >
                    💰 {lang === 'ru' ? 'Только с ценой' : lang === 'tr' ? 'Fiyatlı olanlar' : 'Only with price'}
                  </button>

                  {(selectedCategory === 'Все' || selectedCategory === 'Недвижимость') && (
                    <>
                      <button 
                        onClick={() => setFilterDealType(filterDealType === 'rent' ? 'Все' : 'rent')} 
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                          filterDealType === 'rent' 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' 
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 dark:text-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10'
                        }`}
                      >
                        🔑 {lang === 'ru' ? 'Аренда' : lang === 'tr' ? 'Kiralık' : 'Rent'}
                      </button>

                      <button 
                        onClick={() => setFilterDealType(filterDealType === 'sale' ? 'Все' : 'sale')} 
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                          filterDealType === 'sale' 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' 
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 dark:text-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10'
                        }`}
                      >
                        🏠 {lang === 'ru' ? 'Продажа' : lang === 'tr' ? 'Satılık' : 'Sale'}
                      </button>

                      <button 
                        onClick={() => setFilterMaxPrice(filterMaxPrice === '500' ? '' : '500')} 
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                          filterMaxPrice === '500' 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' 
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 dark:text-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10'
                        }`}
                      >
                        💶 {lang === 'ru' ? 'До 500 €' : lang === 'tr' ? '500 € Altı' : 'Under 500 €'}
                      </button>
                    </>
                  )}

                  {selectedCountry === 'Северный Кипр' && (
                    <button 
                      onClick={handleNearMeClick} 
                      disabled={nearMeLoading}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5 ${
                        filterCity !== 'Все' && ["гирне", "искеле", "фамагуста", "никосия", "гюзельюрт", "лефке"].includes(filterCity)
                          ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' 
                          : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 dark:text-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10'
                      }`}
                    >
                      📍 {nearMeLoading ? (lang === 'ru' ? 'Поиск...' : 'Searching...') : (lang === 'ru' ? 'Рядом со мной' : 'Near me')}
                    </button>
                  )}
                </div>

                {/* Раскрывающийся блок расширенных фильтров */}
                <details className="group border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-white/5 shadow-sm overflow-hidden transition-all duration-300">
                  <summary className="flex items-center justify-between p-4 cursor-pointer select-none font-bold text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2">
                      <span>⚙️</span>
                      <span>{lang === 'ru' ? 'Расширенные фильтры' : lang === 'tr' ? 'Gelişmiş Filtreler' : 'Advanced Filters'}</span>
                    </div>
                    <span className="transition-transform duration-300 group-open:rotate-180 text-gray-400">▼</span>
                  </summary>
                  
                  <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-black/10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1. Город */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                        {lang === 'ru' ? 'Город / Район' : lang === 'tr' ? 'Şehir / Bölge' : 'City / District'}
                      </label>
                      <select 
                        value={filterCity} 
                        onChange={e => setFilterCity(e.target.value)} 
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                      >
                        <option value="Все" className="text-gray-900">{lang === 'ru' ? 'Любой город' : 'Any City'}</option>
                        {getCitiesForCountry().map((city) => (
                          <option key={city.value} value={city.value} className="text-gray-900">{city.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Цена */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                        {lang === 'ru' ? 'Цена' : lang === 'tr' ? 'Fiyat' : 'Price'}
                      </label>
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1">
                        <input 
                          type="number" 
                          placeholder={lang === 'ru' ? 'от' : 'Min'} 
                          value={filterMinPrice} 
                          onChange={e => setFilterMinPrice(e.target.value)} 
                          className="w-full bg-transparent border-none p-2 text-sm focus:ring-0 outline-none placeholder-gray-400 text-gray-900 dark:text-white" 
                        />
                        <span className="text-gray-300 dark:text-white/20">—</span>
                        <input 
                          type="number" 
                          placeholder={lang === 'ru' ? 'до' : 'Max'} 
                          value={filterMaxPrice} 
                          onChange={e => setFilterMaxPrice(e.target.value)} 
                          className="w-full bg-transparent border-none p-2 text-sm focus:ring-0 outline-none placeholder-gray-400 text-gray-900 dark:text-white" 
                        />
                      </div>
                    </div>

                    {/* 3. Категорийно-зависимые поля */}
                    {(selectedCategory === 'Недвижимость' || selectedCategory === 'Все') && (
                      <div className="flex flex-col gap-3 md:col-span-3 border-t border-gray-100 dark:border-white/10 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                              {lang === 'ru' ? 'Тип сделки' : lang === 'tr' ? 'İşlem Tipi' : 'Deal Type'}
                            </label>
                            <div className="flex gap-2">
                              {(['Все', 'rent', 'sale'] as const).map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setFilterDealType(type)}
                                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                    filterDealType === type
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10'
                                  }`}
                                >
                                  {type === 'Все' ? (lang === 'ru' ? 'Любой' : 'Any') : type === 'rent' ? (lang === 'ru' ? 'Аренда' : 'Rent') : (lang === 'ru' ? 'Продажа' : 'Sale')}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                              {lang === 'ru' ? 'Планировка' : lang === 'tr' ? 'Plan / Oda sayısı' : 'Layout / Rooms'}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {['studio', '1+1', '2+1', '3+1', '4+'].map(plan => {
                                const isChecked = filterPropertyPlans.includes(plan);
                                const displayPlan = plan === 'studio' ? (lang === 'ru' ? 'Студия' : 'Studio') : plan;
                                return (
                                  <button
                                    key={plan}
                                    type="button"
                                    onClick={() => {
                                      setFilterPropertyPlans(prev =>
                                        prev.includes(plan) ? prev.filter(p => p !== plan) : [...prev, plan]
                                      );
                                    }}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                                      isChecked
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10'
                                    }`}
                                  >
                                    {displayPlan}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(selectedCategory === 'Транспорт') && (
                      <div className="flex flex-col gap-3 md:col-span-3 border-t border-gray-100 dark:border-white/10 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                              {lang === 'ru' ? 'Год выпуска (от)' : lang === 'tr' ? 'Model Yılı (en az)' : 'Car Year (from)'}
                            </label>
                            <input 
                              type="number" 
                              placeholder="Напр: 2018" 
                              value={filterMinYear} 
                              onChange={e => setFilterMinYear(e.target.value)} 
                              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                              {lang === 'ru' ? 'Максимальный пробег (км)' : lang === 'tr' ? 'Maksimum Kilometre (km)' : 'Max Mileage (km)'}
                            </label>
                            <input 
                              type="number" 
                              placeholder="Напр: 100000" 
                              value={filterMaxMileage} 
                              onChange={e => setFilterMaxMileage(e.target.value)} 
                              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1 w-full lg:w-2/3 xl:w-3/4">
                {/* Mobile News Carousel (only visible on mobile/tablet) */}
                <div className="block lg:hidden mb-6">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔥</span>
                      <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                        {lang === 'ru' ? 'Свежие новости' : lang === 'tr' ? 'Son Haberler' : 'Fresh News'}
                      </h2>
                    </div>
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      {lang === 'ru' ? 'В эфире' : lang === 'tr' ? 'Canlı' : 'Live'}
                    </span>
                  </div>
                  
                  {newsListings.length === 0 ? (
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-6 text-center text-gray-500 border border-gray-100 dark:border-white/10 shadow-sm">
                      <span className="text-2xl block mb-1">📰</span>
                      <p className="text-xs font-medium">
                        {lang === 'ru' ? 'Пока нет свежих новостей' : lang === 'tr' ? 'Henüz haber yok' : 'No news yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-thin no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                      {newsListings.slice(0, 5).map((news) => (
                        <div key={news.id} className="min-w-[280px] max-w-[280px] bg-white dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/10 shadow-sm snap-start flex flex-col justify-between shrink-0">
                          <Link href={`/listing/${news.id}`} className="group flex flex-col gap-2 cursor-pointer h-full">
                            {news.image_url && (
                              <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 shrink-0">
                                <img 
                                  src={news.image_url.includes('promo_banner') ? '/uploads/telegram/default_news.jpg' : news.image_url} 
                                  alt={news.title} 
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            )}
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded uppercase mb-1 inline-block">
                                  {news.source || 'Telegram News'}
                                </span>
                                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                  {getTranslatedField(news, 'title', lang)}
                                </h3>
                              </div>
                              <div className="text-[10px] text-gray-400 mt-2">
                                {new Date(news.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                      <div className="min-w-[150px] bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/30 shadow-sm snap-start flex flex-col items-center justify-center text-center shrink-0">
                        <Link 
                          href="https://t.me/news_cyprus_north" 
                          target="_blank"
                          className="flex flex-col items-center gap-1.5 cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <span className="text-2xl">📱</span>
                          <span className="text-[10px] font-black uppercase tracking-wider">{lang === 'ru' ? 'Все новости' : 'All News'}</span>
                          <span className="text-[9px] font-bold text-gray-400">{lang === 'ru' ? 'в Telegram' : 'on Telegram'} →</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Results Count */}
                {marketplaceListings.length > 0 && (
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                      {lang === 'ru' ? `${marketplaceListings.length} объявлений` : lang === 'tr' ? `${marketplaceListings.length} ilan` : `${marketplaceListings.length} listings`}
                    </span>
                    {sortMode !== 'default' && (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                        {sortMode === 'cheap' ? (lang === 'ru' ? '↑ Сначала дешевле' : 'Price ↑') : sortMode === 'expensive' ? (lang === 'ru' ? '↓ Сначала дороже' : 'Price ↓') : (lang === 'ru' ? '🕐 По дате' : 'Newest')}
                      </span>
                    )}
                  </div>
                )}
                {marketplaceListings.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
                    <span className="text-5xl mb-4 block">📦</span>
                    <p className="font-semibold text-lg text-gray-800">
                      {lang === 'ru' ? 'Ничего не найдено' : lang === 'tr' ? 'Sonuç bulunamadı' : 'No listings found'}
                    </p>
                    <p className="text-sm mt-1 mb-6">
                      {lang === 'ru' ? 'Попробуйте изменить фильтры или поиск.' : lang === 'tr' ? 'Filtreleri veya aramayı değiştirmeyi deneyin.' : 'Try changing filters or search terms.'}
                    </p>
                    <button 
                      onClick={() => {
                        setSelectedCategory('Все');
                        setSelectedSubcategory('Все');
                        setSelectedCountry('Северный Кипр');
                        setSearchQuery('');
                        setShowFavoritesOnly(false);
                        setFilterCity('Все');
                        setFilterMinPrice('');
                        setFilterMaxPrice('');
                        setFilterDealType('Все');
                        setFilterPropertyPlans([]);
                        setFilterMinYear('');
                        setFilterMaxMileage('');
                        setOnlyOfficial(false);
                        setOnlyWithPrice(false);
                      }}
                      className="text-blue-600 font-bold hover:underline bg-blue-50 px-6 py-2 rounded-xl transition-all hover:bg-blue-100"
                    >
                      {lang === 'ru' ? 'Сбросить все фильтры' : lang === 'tr' ? 'Tüm filtreleri sıfırla' : 'Reset all filters'}
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    initial="hidden" animate="visible" 
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                    }} 
                    className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-10"
                  >
                    {marketplaceListings.slice(0, visibleCount).map((item, index) => {
                      const isFPY = item.id === 'FPY37jBN5znxPfuN1FNt';

                      return (
                        <Fragment key={item.id}>
                          {index === 1 && (
                            <>
                              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} whileHover={{ y: -5 }}>
                                {renderSuperVipCard()}
                              </motion.div>
                              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} whileHover={{ y: -5 }}>
                                {renderVoicePromoCard()}
                              </motion.div>
                            </>
                          )}
                          {index === (firstNonOfficialIndex !== -1 ? firstNonOfficialIndex : 1) && (
                            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} whileHover={{ y: -5 }}>
                                {renderPriorityCard()}
                            </motion.div>
                          )}
                          
                          {/* Баннерная реклама каждые 12 карточек */}
                          {index > 0 && index % 12 === 0 && (
                            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="col-span-2 lg:col-span-3">
                              <BannerAd lang={lang} position="feed" />
                            </motion.div>
                          )}

                          {isFPY ? (
                            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} whileHover={{ y: -5 }}>
                            <Link href={`/listing/${item.id}`} className="group cursor-pointer block h-full min-h-[340px] sm:min-h-[380px]">
                              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 shadow-xl border border-indigo-500/30 flex flex-col p-1.5 transition-all duration-300 hover:shadow-indigo-500/40 hover:-translate-y-1 h-full">
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-60 pointer-events-none group-hover:opacity-80 transition-all duration-700" />
                                
                                <div className="absolute top-3 left-3 z-30 flex gap-2">
                                  <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-blue-950 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse">
                                    <span>👑</span>
                                    <span>{lang === 'ru' ? 'СУПЕР ВИП ЗАКРЕП' : 'SUPER VIP PIN'}</span>
                                  </div>
                                </div>

                                <div className="absolute top-3 right-3 z-30 flex gap-2">
                                  <button onClick={(e) => toggleFavorite(item.id, e)} className={`backdrop-blur-md p-1.5 sm:p-2 rounded-xl shadow-lg transition-all flex items-center justify-center border ${favorites.includes(item.id) ? 'bg-white border-red-100 text-red-500' : 'bg-white/10 border-white/20 text-white/70 hover:text-red-400'}`}>
                                    {favorites.includes(item.id) ? '❤️' : '🤍'}
                                  </button>
                                </div>

                                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-2">
                                  {(item.image_url && item.image_url !== 'None' && item.image_url !== 'null' && item.image_url !== 'undefined' && item.image_url !== '[]') ? (
                                     <img src={item.image_url} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                  ) : (
                                     <img src="/promo_banner.webp" alt="PulseMarket Promo" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                  )}
                                </div>
                                
                                <div className="px-2 pb-2 flex flex-col flex-1 z-10">
                                   <h3 className="text-sm sm:text-base font-black text-white leading-snug group-hover:text-amber-300 transition-colors line-clamp-2 mb-1.5" title={item.title}>
                                     {cleanListingTitle(getTranslatedField(item, 'title', lang))}
                                   </h3>
                                   <div className="text-xl font-black text-amber-400 mb-2.5">
                                     {getFormattedPrice(item.price, item.currency, lang)}
                                   </div>

                                   <div className="flex flex-wrap gap-1.5 mb-3.5 mt-auto">
                                     {/* Тег 1: Аренда/Продажа */}
                                     {(() => {
                                       const dealType = getListingSubcategory(item.title || '', item.description || '', item.category || '', Number(item.price || 0));
                                       const dealTypeLabel = getDealTypeLabel(item, lang);
                                       return (
                                         <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                                           dealType === 'Сдаю'
                                             ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                                             : dealType === 'Продам'
                                             ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                             : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                         }`}>
                                           {dealTypeLabel}
                                         </span>
                                       );
                                     })()}

                                     {/* Тег 2: Район */}
                                     {(() => {
                                       const locLabel = getLocationLabel(getTranslatedField(item, 'location', lang));
                                       if (!locLabel) return null;
                                       return (
                                         <span className="bg-slate-800/80 text-slate-200 border border-slate-700/50 text-[10px] font-bold px-2 py-0.5 rounded-md truncate max-w-[110px]" title={getTranslatedField(item, 'location', lang)}>
                                           📍 {locLabel}
                                         </span>
                                       );
                                     })()}

                                     {/* Тег 3: Тип (Категория) */}
                                     {(() => {
                                       const catObj = categories.find(c => c.id === item.category);
                                       const categoryLabel = catObj ? catObj.name : item.category;
                                       return (
                                         <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                           {categoryLabel}
                                         </span>
                                       );
                                     })()}

                                     {/* Доп. теги из метаданных (комнаты, год, пробег) */}
                                     {item.metadata?.rooms && (
                                       <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                         🛏️ {item.metadata.rooms}
                                       </span>
                                     )}
                                     {item.metadata?.area && (
                                       <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                         📐 {item.metadata.area} м²
                                       </span>
                                     )}
                                     {item.metadata?.year && (
                                       <span className="bg-slate-800/80 text-slate-200 border border-slate-700/30 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                         📅 {item.metadata.year}
                                       </span>
                                     )}
                                     {item.metadata?.mileage && (
                                       <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                         🛣️ {Number(item.metadata.mileage).toLocaleString()} км
                                       </span>
                                     )}
                                   </div>

                                   <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] text-slate-300 font-medium">
                                     {/* Дата */}
                                     <div className="flex items-center gap-1">
                                       <span>📅</span>
                                       <span>
                                         {new Date(item.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
                                       </span>
                                     </div>

                                     {/* Источник */}
                                     {(() => {
                                       const srcInfo = getSourceInfo(item, lang);
                                       return (
                                         <div className="flex items-center gap-1 shrink-0 text-amber-300" title={item.source}>
                                           <span>{srcInfo.icon}</span>
                                           <span className="font-semibold">{srcInfo.label}</span>
                                         </div>
                                       );
                                     })()}
                                   </div>
                                </div>
                              </div>
                            </Link>
                            </motion.div>
                          ) : (
                            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} whileHover={{ y: -5 }} className="h-full">
                              <Link href={`/listing/${item.id}`} className="group cursor-pointer block h-full">
                          <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 glass-card transition-all duration-300 ${
                            item.is_vip
                              ? 'ring-2 ring-amber-400/70 shadow-[0_0_25px_rgba(251,191,36,0.5)]'
                              : item.is_priority || String(item.source || '').toLowerCase().includes('northcyprus_island')
                              ? 'ring-2 ring-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                              : ''
                          }`}>
                            {(item.image_url && item.image_url !== 'None' && item.image_url !== 'null' && item.image_url !== 'undefined' && item.image_url !== '[]') ? (
                              <img 
                                src={item.image_url} 
                                alt={item.title} 
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            ) : (
                              <img 
                                src="/promo_banner.webp" 
                                alt="PulseMarket Promo" 
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            )}
                            <div className="absolute top-3 right-3 flex flex-col gap-2 z-30">
                              <button 
                                onClick={(e) => toggleFavorite(item.id, e)}
                                className={`backdrop-blur-md p-2 rounded-xl shadow-lg transition-all flex items-center justify-center border ${favorites.includes(item.id) ? 'bg-white border-red-100 text-red-500 scale-105 shadow-red-100' : 'bg-white/90 border-white/20 text-gray-500 hover:text-red-500 hover:scale-105'}`}
                                title={favorites.includes(item.id) ? 'Удалить из избранного' : 'В избранное'}
                              >
                                {favorites.includes(item.id) ? '❤️' : '🤍'}
                              </button>
                            </div>
                            
                            {item.is_vip && (
                              <div className="absolute top-3 left-3 z-30">
                                <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse border border-amber-300/50">
                                  <span>⭐</span>
                                  <span>VIP</span>
                                </div>
                              </div>
                            )}
                            
                            {(String(item.source || '').toLowerCase().includes('northcyprus_island')) ? (() => {
                               const cleanName = (item.source || '')
                                 .replace(/Telegram\s\(@/gi, '')
                                 .replace(/\)/gi, '')
                                 .replace(/Recovery/gi, '')
                                 .trim();
                               
                               return (
                                 <div className={`absolute bottom-3 left-3 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-blue-500/40 backdrop-blur-md text-white text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wider shadow-lg border border-white/20 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-110 hover:brightness-110 z-20`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const u = String(cleanName).replace('@','').trim();
                                      if(u) window.open('https://t.me/' + u, '_blank');
                                    }}
                                    title={'Открыть канал'}
                                  >
                                   <span>👑</span>
                                   <span>{lang === 'ru' ? 'ОФИЦИАЛЬНЫЙ КАНАЛ' : 'OFFICIAL CHANNEL'}</span>
                                 </div>
                               );
                             })() : (String(item.source || '').toLowerCase().includes('личные сообщения боту')) ? (() => {
                               return (
                                 <div className={`absolute bottom-3 left-3 bg-gradient-to-r from-emerald-50 to-teal-600 shadow-emerald-500/40 backdrop-blur-md text-white text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wider shadow-lg border border-white/20 flex items-center gap-1.5 z-20`}>
                                   <span>✅</span>
                                   <span>{lang === 'ru' ? 'ОТ ПОЛЬЗОВАТЕЛЯ' : 'VERIFIED'}</span>
                                 </div>
                               );
                             })() : null}
                          </div>
                          
                          <div className="px-1">
                            <h3 className="text-lg font-medium text-gray-900 leading-tight mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors" title={item.title}>
                              {getTranslatedField(item, 'title', lang)}
                            </h3>
                            
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
                                <span>📍</span> {getTranslatedField(item, 'location', lang)}
                              </div>
                              <div className="text-gray-500 mt-1">
                                {new Date(item.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long' })}
                              </div>
                            </div>
                          </div>
                        </Link>
                        </motion.div>
                        )}

                        {(index > firstNonOfficialIndex && (index - firstNonOfficialIndex) % 18 === 0) && (
                          <div className="col-span-full my-6 px-1">
                            <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-200 shadow-lg transition-all group overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                              
                              <div className="flex items-center gap-4 z-10 text-left pl-2">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30 shadow-inner text-xl select-none transform group-hover:rotate-12 transition-transform duration-300">
                                  💡
                                </div>
                                <div>
                                  <h4 className="text-sm md:text-base font-extrabold text-blue-900 tracking-tight leading-snug">
                                    {lang === 'ru' ? '🤔 Устали раскидывать тексты по чатам, где их никто не читает?' 
                                      : lang === 'tr' ? 'İlanınız sitede yok mu?' 
                                      : 'Is your listing missing from our site?'}
                                  </h4>
                                  <p className="text-[11px] md:text-xs text-blue-700 font-medium mt-1 leading-relaxed max-w-2xl">
                                    {lang === 'ru' ? 'Ваше объявление не должно тонуть в спаме. Опубликуйте его здесь прямо сейчас (это абсолютно бесплатно). Всего 1 минута, и ваше предложение появится на экранах людей, которые ищут именно этот товар.' 
                                      : lang === 'tr' ? 'Hemen şimdi 1 dakikada ücretsiz yayınla! 🚀' 
                                      : 'Post it for free in just 1 minute right now! 🚀'}
                                  </p>
                                </div>
                              </div>
                              
                              <button 
                                onClick={handlePublishCtaClick}
                                className="shrink-0 relative z-10 bg-blue-600 text-white hover:bg-blue-500 px-5 py-3 rounded-xl font-black text-xs md:text-sm shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all duration-300 flex items-center gap-2.5 group/btn active:scale-95"
                              >
                                <span>{lang === 'ru' ? '🚀 Опубликовать' : lang === 'tr' ? 'Şimdi Yayınla' : 'Publish Now'}</span>
                                <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}

                        {(index > firstNonOfficialIndex && (index - firstNonOfficialIndex) % 27 === 0) && (
                          <div className="col-span-full my-6 px-1">
                            <div className="relative bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 hover:from-teal-100 hover:to-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-200 shadow-xl transition-all group overflow-hidden">
                              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0)_100%)] -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
                              
                              <div className="flex items-center gap-4 z-10 text-left pl-2">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-2xl shadow-inner shadow-white/20 select-none transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                                  📱
                                </div>
                                <div>
                                  <h4 className="text-sm md:text-base font-extrabold text-emerald-900 tracking-tight leading-snug">
                                    {lang === 'ru' ? 'Установите приложение PulseMarket' 
                                      : lang === 'tr' ? 'PulseMarket Uygulamasını İndir' 
                                      : 'Install PulseMarket App'}
                                  </h4>
                                  <p className="text-[10px] md:text-xs text-emerald-700 font-medium mt-1 leading-relaxed max-w-2xl">
                                    {lang === 'ru' ? 'Откройте меню браузера (кнопка «Поделиться» в Safari на iPhone или три точки в Chrome на Android) и выберите «На экран Домой». Работает в 1 клик!' 
                                      : lang === 'tr' ? 'Tarayıcı menüsünden "Ana ekrana ekle" seçeneğini kullanarak hemen yükleyin.' 
                                      : 'Add to Home Screen from your browser menu for instant 1-click access without App Stores.'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        </Fragment>
                      );
                    })}
                  </motion.div>
                )}
                {/* Infinite Scroll Trigger */}
                {(marketplaceListings.length >= visibleCount || nextCursor) && (
                  <div ref={loaderRef} className="h-20 mt-8 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin opacity-50"></div>
                  </div>
                )}
              </div>

              {/* Right Side: Sticky "НОВОСТИ" (NEWS) Column */}
              <div className="lg:w-1/3">
                <div className="glass-card p-6 lg:sticky lg:top-24">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
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
                    <div className="py-12 text-center text-gray-500">
                      <span className="text-4xl block mb-2">📰</span>
                      <p className="text-sm font-medium">
                        {lang === 'ru' ? 'Пока нет свежих новостей' : lang === 'tr' ? 'Henüz haber yok' : 'No news yet'}
                      </p>
                    </div>
                  ) : (
                    <motion.div 
                      initial="hidden" animate="visible" 
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                      }}
                      className="flex flex-col gap-6 max-h-[550px] overflow-y-auto pr-2 no-scrollbar"
                    >
                      {newsListings.slice(0, 9).map((news) => (
                        <motion.div key={news.id} variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}>
                        <Link href={`/listing/${news.id}`} className="group border-b border-white/5 pb-5 last:border-0 last:pb-0 block cursor-pointer">
                          {news.image_url && (
                            <div className="aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-gray-50">
                              <img 
                                src={news.image_url.includes('promo_banner') ? '/uploads/telegram/default_news.jpg' : news.image_url} 
                                alt={news.title} 
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-md uppercase mb-2 inline-block">
                              {news.source || 'Telegram News'}
                            </span>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 line-clamp-3">
                              {getTranslatedField(news, 'title', lang)}
                            </h3>
                            <div className="text-[11px] text-gray-500">
                              {new Date(news.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </Link>
                        </motion.div>
                      ))}
                      
                      {newsListings.length > 9 && (
                        <Link 
                          href="https://t.me/news_cyprus_north" 
                          target="_blank"
                          className="mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 py-4 px-4 rounded-2xl transition-all group backdrop-blur-sm"
                        >
                          <div className="flex flex-col items-center text-center">
                            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                              Читать все новости <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                            <span className="text-[10px] font-bold text-indigo-400 mt-0.5">в нашем Telegram-канале</span>
                          </div>
                        </Link>
                      )}
                    </motion.div>
                  )}
                </div>
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
              <Link
                href="https://t.me/BotHelpG_bot"
                target="_blank"
                className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-xl hover:-translate-y-1 block text-center"
              >
                {t.openBot}
              </Link>
              <button className="bg-indigo-500 text-white border-2 border-indigo-400 px-8 py-4 rounded-2xl font-black hover:bg-indigo-400 transition-all">
                {t.howItWorks}
              </button>
            </div>
          </div>
          <div className="relative z-10 lg:w-1/3 flex justify-center">
             <div className="w-64 h-64 bg-white/10 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
             <div className="text-[12rem] animate-bounce">🤖</div>
          </div>
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full -ml-48 -mb-48 blur-3xl"></div>
        </div>
      </section>

      <footer className="bg-white py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-gray-900">PulseMarket</span>
              <span className="text-xs text-gray-505">by Sergey</span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-gray-500">
              <span className="hover:text-blue-600 cursor-pointer">{t.footerAbout}</span>
              <span className="hover:text-blue-600 cursor-pointer">{t.footerAds}</span>
              <span className="hover:text-blue-600 cursor-pointer">{t.footerRules}</span>
              <span className="hover:text-blue-600 cursor-pointer">{t.footerContacts}</span>
            </div>
            <p className="text-gray-500 text-xs font-medium">
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
              className="absolute top-5 right-5 text-gray-500 hover:text-gray-700 text-xl font-bold transition-colors z-10"
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
                    href="https://t.me/BotHelpG_bot?start=publish" 
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
                    <input required minLength={3} type="text" placeholder="Что продаете?" value={formData.title} onChange={f => setFormData({...formData, title: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50 text-gray-950" />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Категория *</label>
                    <select value={formData.category} onChange={f => setFormData({...formData, category: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-white shadow-sm font-semibold text-gray-950">
                      <option value="Недвижимость">🏠 Недвижимость</option>
                      <option value="Транспорт">🚗 Транспорт</option>
                      <option value="Услуги">🛠️ Услуги</option>
                      <option value="Мебель">🛋️ Мебель</option>
                      <option value="Одежда">👕 Одежда</option>
                      <option value="Работа">💼 Работа</option>
                    </select>
                  </div>

                  {formData.category === 'Недвижимость' && (
                    <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-black text-blue-800 mb-1 block">Тип сделки</label>
                          <select value={formData.listing_type} onChange={f => setFormData({...formData, listing_type: f.target.value})} className="w-full border border-blue-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none bg-white text-gray-950">
                            <option>Аренда</option><option>Продажа</option><option>Посуточно</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-black text-blue-800 mb-1 block">Планировка</label>
                          <select value={formData.rooms} onChange={f => setFormData({...formData, rooms: f.target.value})} className="w-full border border-blue-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none bg-white text-gray-950">
                            <option>Студия</option><option>1+1</option><option>2+1</option><option>3+1</option><option>4+ и больше</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-black text-blue-800 mb-1 block">🌊 Расстояние до моря (метров/км)</label>
                        <input type="text" placeholder="Напр: 500м или 5 мин пешком" value={formData.distance_to_sea} onChange={f => setFormData({...formData, distance_to_sea: f.target.value})} className="w-full border border-blue-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none bg-white text-gray-950" />
                      </div>
                    </div>
                  )}

                  {formData.category === 'Транспорт' && (
                    <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-black text-amber-800 mb-1 block">Год выпуска</label>
                          <input type="number" placeholder="2022" value={formData.year} onChange={f => setFormData({...formData, year: f.target.value})} className="w-full border border-amber-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none bg-white text-gray-950" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-black text-amber-800 mb-1 block">Пробег (км)</label>
                          <input type="number" placeholder="50000" value={formData.mileage} onChange={f => setFormData({...formData, mileage: f.target.value})} className="w-full border border-amber-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none bg-white text-gray-950" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Цена *</label>
                      <input required type="number" placeholder="1000" value={formData.price} onChange={f => setFormData({...formData, price: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50 text-gray-950" />
                    </div>
                    <div className="w-20">
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Валюта</label>
                      <select value={formData.currency} onChange={f => setFormData({...formData, currency: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50 text-gray-950">
                        <option>$</option><option>€</option><option>TL</option><option>₽</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Город/Район *</label>
                    <input required minLength={3} type="text" placeholder="Напр: Гирне" value={formData.location} onChange={f => setFormData({...formData, location: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50 text-gray-950" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Страна</label>
                    <select value={formData.country} onChange={f => setFormData({...formData, country: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50 text-gray-950">
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
                      <input type="url" placeholder="Ссылка..." value={formData.video_url} onChange={f => setFormData({...formData, video_url: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50 text-gray-950" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Описание</label>
                    <textarea rows={3} placeholder="Детали товара..." value={formData.description} onChange={f => setFormData({...formData, description: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50 resize-none text-gray-950"></textarea>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Телефон / Контакт *</label>
                    <input required type="text" placeholder="+7..." value={formData.contact} onChange={f => setFormData({...formData, contact: f.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none bg-gray-50 text-gray-950" />
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
                    className="text-xs text-gray-500 font-semibold underline mt-1 text-center w-full"
                  >
                    Вернуться к выбору
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Scroll to Top FAB */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:-translate-y-1 active:scale-95"
          aria-label="Scroll to top"
          title={lang === 'ru' ? 'Наверх' : lang === 'tr' ? 'Yukarı' : 'Back to top'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Welcome Overlay for First-Time Visitors */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            <div className="text-6xl mb-4 animate-bounce">👋</div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              {lang === 'ru' ? 'Добро пожаловать в PulseMarket!' : lang === 'tr' ? 'PulseMarket\'e Hoş Geldiniz!' : 'Welcome to PulseMarket!'}
            </h2>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              {lang === 'ru'
                ? 'Здесь собраны объявления из 50+ Telegram-групп. Используйте категории для навигации, 🔍 поиск для быстрого нахождения и ❤️ для сохранения избранного.'
                : lang === 'tr'
                ? '50+ Telegram grubundan ilanlar burada toplanıyor. Kategorileri kullanın, 🔍 arayın ve ❤️ favorilerinize kaydedin.'
                : 'Listings from 50+ Telegram groups are collected here. Use categories to navigate, 🔍 search to find, and ❤️ to save favorites.'}
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">🏷️</div>
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                  {lang === 'ru' ? 'Категории' : lang === 'tr' ? 'Kategoriler' : 'Categories'}
                </span>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">🔍</div>
                <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                  {lang === 'ru' ? 'Поиск' : lang === 'tr' ? 'Arama' : 'Search'}
                </span>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">❤️</div>
                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">
                  {lang === 'ru' ? 'Избранное' : lang === 'tr' ? 'Favoriler' : 'Favorites'}
                </span>
              </div>
            </div>
            <button
              onClick={dismissWelcome}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all text-sm"
            >
              {lang === 'ru' ? '🚀 Понятно, начнём!' : lang === 'tr' ? '🚀 Anladım, başlayalım!' : '🚀 Got it, let\'s go!'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
