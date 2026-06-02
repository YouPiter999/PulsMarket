'use client';

import { useState, useEffect } from 'react';

interface BannerConfig {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  gradient: string;
  emoji: string;
  badge?: string;
}

const banners: Record<string, BannerConfig[]> = {
  ru: [
    {
      id: 'ai_text',
      title: 'Ваш текст продаёт слабо?',
      description: 'ИИ-копирайтер перепишет объявление за 5 секунд — в 3 раза больше откликов!',
      cta: 'Попробовать за 49 ⭐',
      href: 'https://t.me/BotHelpG_bot?start=ai_text',
      gradient: 'from-violet-600 to-indigo-700',
      emoji: '✨',
      badge: 'AI-ТЕКСТ',
    },
    {
      id: 'ai_photo',
      title: 'Фото как у фотографа за $200',
      description: 'ИИ выровняет свет, добавит чёткость и сочные цвета. Мгновенно!',
      cta: 'Улучшить фото — 49 ⭐',
      href: 'https://t.me/BotHelpG_bot?start=ai_photo',
      gradient: 'from-emerald-600 to-teal-700',
      emoji: '📸',
      badge: 'AI-ФОТО',
    },
    {
      id: 'vip',
      title: 'Хотите быть в ТОПе 7 дней?',
      description: 'VIP-размещение: золотой бэйдж + светящаяся рамка + x5 просмотров',
      cta: 'Подключить VIP — 149 ⭐',
      href: 'https://t.me/BotHelpG_bot?start=vip',
      gradient: 'from-amber-500 to-orange-600',
      emoji: '⭐',
      badge: 'VIP',
    },
    {
      id: 'pro',
      title: 'Pro-аккаунт = безлимит + AI бесплатно',
      description: 'Безлимит объявлений, AI-текст бесплатно, 1 VIP в месяц. Всё за 499 ⭐/мес.',
      cta: 'Подключить Pro',
      href: '/pricing',
      gradient: 'from-blue-600 to-indigo-700',
      emoji: '🚀',
      badge: 'PRO',
    },
  ],
  en: [
    {
      id: 'ai_text',
      title: 'Is your text selling poorly?',
      description: 'AI copywriter rewrites your listing in 5 seconds — 3x more responses!',
      cta: 'Try for 49 ⭐',
      href: 'https://t.me/BotHelpG_bot?start=ai_text',
      gradient: 'from-violet-600 to-indigo-700',
      emoji: '✨',
      badge: 'AI TEXT',
    },
    {
      id: 'ai_photo',
      title: 'Photos like a $200 photographer',
      description: 'AI corrects lighting, adds sharpness and vibrant colors. Instantly!',
      cta: 'Enhance photo — 49 ⭐',
      href: 'https://t.me/BotHelpG_bot?start=ai_photo',
      gradient: 'from-emerald-600 to-teal-700',
      emoji: '📸',
      badge: 'AI PHOTO',
    },
    {
      id: 'vip',
      title: 'Want to be on TOP for 7 days?',
      description: 'VIP placement: gold badge + glowing frame + x5 views',
      cta: 'Get VIP — 149 ⭐',
      href: 'https://t.me/BotHelpG_bot?start=vip',
      gradient: 'from-amber-500 to-orange-600',
      emoji: '⭐',
      badge: 'VIP',
    },
    {
      id: 'pro',
      title: 'Pro account = unlimited + free AI',
      description: 'Unlimited listings, free AI text, 1 VIP/month. All for 499 ⭐/mo.',
      cta: 'Get Pro',
      href: '/pricing',
      gradient: 'from-blue-600 to-indigo-700',
      emoji: '🚀',
      badge: 'PRO',
    },
  ],
  tr: [
    {
      id: 'ai_text',
      title: 'Metniniz yetersiz mi satıyor?',
      description: 'AI metin yazarı ilanınızı 5 saniyede yeniden yazar — 3 kat daha fazla yanıt!',
      cta: '49 ⭐ ile dene',
      href: 'https://t.me/BotHelpG_bot?start=ai_text',
      gradient: 'from-violet-600 to-indigo-700',
      emoji: '✨',
      badge: 'AI METİN',
    },
    {
      id: 'ai_photo',
      title: '$200 fotoğrafçı kalitesinde fotoğraf',
      description: 'AI ışığı düzeltir, netlik ve canlı renkler ekler. Anında!',
      cta: 'Fotoğraf iyileştir — 49 ⭐',
      href: 'https://t.me/BotHelpG_bot?start=ai_photo',
      gradient: 'from-emerald-600 to-teal-700',
      emoji: '📸',
      badge: 'AI FOTOĞRAF',
    },
    {
      id: 'vip',
      title: '7 gün TOP\'ta olmak ister misiniz?',
      description: 'VIP: altın rozet + parlayan çerçeve + 5 kat görüntüleme',
      cta: 'VIP al — 149 ⭐',
      href: 'https://t.me/BotHelpG_bot?start=vip',
      gradient: 'from-amber-500 to-orange-600',
      emoji: '⭐',
      badge: 'VIP',
    },
    {
      id: 'pro',
      title: 'Pro hesap = sınırsız + ücretsiz AI',
      description: 'Sınırsız ilan, ücretsiz AI metin, ayda 1 VIP. Tümü 499 ⭐/ay.',
      cta: 'Pro Al',
      href: '/pricing',
      gradient: 'from-blue-600 to-indigo-700',
      emoji: '🚀',
      badge: 'PRO',
    },
  ],
};

export function BannerAd({ lang = 'ru', position = 'feed' }: { lang?: 'ru' | 'en' | 'tr'; position?: 'feed' | 'sidebar' | 'detail' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const langBanners = (banners[lang] || banners.ru).filter(b => !dismissed.includes(b.id));

  useEffect(() => {
    if (langBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % langBanners.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [langBanners.length]);

  if (langBanners.length === 0) return null;
  const banner = langBanners[currentIndex % langBanners.length];
  if (!banner) return null;

  const isExternal = banner.href.startsWith('http');

  return (
    <div className="relative w-full group">
      <a
        href={banner.href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className={`
          block relative overflow-hidden rounded-2xl
          bg-gradient-to-r ${banner.gradient}
          p-5 sm:p-6 text-white
          shadow-xl hover:shadow-2xl
          transition-all duration-300 hover:-translate-y-0.5
          border border-white/10
        `}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0)_0%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0)_100%)] -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="text-3xl sm:text-4xl shrink-0 select-none">
            {banner.emoji}
          </div>
          <div className="flex-1 min-w-0">
            {banner.badge && (
              <span className="inline-block bg-white/20 backdrop-blur-sm text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-1.5">
                {banner.badge}
              </span>
            )}
            <h4 className="font-black text-sm sm:text-base leading-snug line-clamp-1">{banner.title}</h4>
            <p className="text-[11px] sm:text-xs text-white/80 mt-0.5 line-clamp-1">{banner.description}</p>
          </div>
          <div className="shrink-0">
            <span className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-3 py-2 rounded-xl transition-all whitespace-nowrap">
              {banner.cta} →
            </span>
          </div>
        </div>

        {/* Dots indicator */}
        {langBanners.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {langBanners.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex % langBanners.length ? 'bg-white w-4' : 'bg-white/30'}`} />
            ))}
          </div>
        )}
      </a>

      {/* Dismiss button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDismissed(prev => [...prev, banner.id]);
        }}
        className="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 border border-slate-600 rounded-full text-[10px] text-slate-400 hover:text-white hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center z-20"
        title="Скрыть"
      >
        ✕
      </button>
    </div>
  );
}
