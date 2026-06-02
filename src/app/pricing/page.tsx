'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const [lang, setLang] = useState<'ru' | 'en' | 'tr'>('ru');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'tr') setLang('tr');
    else if (browserLang === 'en') setLang('en');
    else setLang('ru');
  }, []);

  const t = {
    ru: {
      hero: 'Продавайте быстрее с ИИ',
      heroSub: 'Наши инструменты увеличивают отклики на объявления в 3-5 раз. Без фотографа, без копирайтера — всё делает искусственный интеллект.',
      monthly: 'Ежемесячно',
      yearly: 'Годовой (скидка 20%)',
      free: 'Бесплатный',
      freePrice: '0',
      freeDesc: 'Для тех, кто только начинает',
      freeFeatures: [
        '3 объявления в день',
        'Базовый ИИ-классификатор',
        'Публикация на сайте',
        'Голосовой ввод',
      ],
      pro: 'Pro',
      proPrice: '499',
      proDesc: 'Для активных продавцов',
      proFeatures: [
        'Безлимит объявлений',
        '✨ AI-текст бесплатно',
        '1 VIP-размещение / мес',
        'Приоритет в ленте',
        'Поддержка 24/7',
      ],
      agency: 'Agency',
      agencyPrice: '1499',
      agencyDesc: 'Для агентств и бизнеса',
      agencyFeatures: [
        'Всё из Pro',
        '📸 AI-фото бесплатно',
        '5 VIP-размещений / мес',
        'Золотой бэйдж на карточках',
        'Персональный менеджер',
        'API доступ',
      ],
      perMonth: '⭐ / мес',
      popular: 'Популярный',
      cta: 'Подключить',
      ctaFree: 'Начать бесплатно',
      guarantee: '7 дней возврат без вопросов',
      comparison: 'Сравните стоимость',
      vsPhotographer: 'Профессиональный фотограф',
      vsPhotographerPrice: '$50-200 за сессию',
      vsCopywriter: 'Копирайтер',
      vsCopywriterPrice: '$20-50 за текст',
      vsUs: 'PulseMarket AI',
      vsUsPrice: '49 ⭐ (≈ $1)',
      testimonialTitle: 'Что говорят наши пользователи',
      testimonials: [
        { name: 'Анна К.', text: 'AI-текст увеличил просмотры моей квартиры в 4 раза! Сняли за 2 дня вместо 2 недель.', role: 'Арендодатель, Гирне' },
        { name: 'Марк Д.', text: 'Раньше платил фотографу $100 за каждый объект. Теперь AI делает то же самое за минуту.', role: 'Агент недвижимости' },
        { name: 'Елена В.', text: 'VIP-размещение окупилось за первый день — 12 откликов вместо обычных 2-3.', role: 'Продавец авто' },
      ],
      faq: 'Частые вопросы',
      faqs: [
        { q: 'Как работает AI-текст?', a: 'Наш ИИ-копирайтер анализирует ваше объявление и переписывает его продающим стилем: добавляет эмоции, подчёркивает выгоды, структурирует текст. Результат за 5 секунд.' },
        { q: 'Что делает AI-фотограф?', a: 'Gemini Vision анализирует ваше фото и автоматически корректирует яркость, контраст, насыщенность и резкость. Как профессиональная обработка, но мгновенно.' },
        { q: 'Что даёт VIP-размещение?', a: 'Ваше объявление поднимается в ТОП ленты на 7 дней, получает золотой бэйдж и светящуюся рамку. В среднем x5 просмотров.' },
        { q: 'Могу ли я отменить подписку?', a: 'Да, в любой момент. Первые 7 дней — возврат без вопросов через Telegram Stars.' },
      ],
    },
    en: {
      hero: 'Sell Faster with AI',
      heroSub: 'Our tools increase listing responses by 3-5x. No photographer, no copywriter — AI handles everything.',
      monthly: 'Monthly',
      yearly: 'Yearly (20% off)',
      free: 'Free',
      freePrice: '0',
      freeDesc: 'For those just starting',
      freeFeatures: ['3 listings/day', 'Basic AI classifier', 'Website publishing', 'Voice input'],
      pro: 'Pro',
      proPrice: '499',
      proDesc: 'For active sellers',
      proFeatures: ['Unlimited listings', '✨ Free AI text', '1 VIP/month', 'Feed priority', '24/7 Support'],
      agency: 'Agency',
      agencyPrice: '1499',
      agencyDesc: 'For agencies & business',
      agencyFeatures: ['Everything in Pro', '📸 Free AI photos', '5 VIP/month', 'Gold badge', 'Personal manager', 'API access'],
      perMonth: '⭐ / mo',
      popular: 'Popular',
      cta: 'Subscribe',
      ctaFree: 'Start Free',
      guarantee: '7-day money-back guarantee',
      comparison: 'Compare the cost',
      vsPhotographer: 'Professional photographer',
      vsPhotographerPrice: '$50-200 per session',
      vsCopywriter: 'Copywriter',
      vsCopywriterPrice: '$20-50 per text',
      vsUs: 'PulseMarket AI',
      vsUsPrice: '49 ⭐ (≈ $1)',
      testimonialTitle: 'What our users say',
      testimonials: [
        { name: 'Anna K.', text: 'AI text increased my apartment views 4x! Rented in 2 days instead of 2 weeks.', role: 'Landlord, Girne' },
        { name: 'Mark D.', text: 'Used to pay $100 per property for a photographer. Now AI does it in a minute.', role: 'Real estate agent' },
        { name: 'Elena V.', text: 'VIP paid for itself on day one — 12 responses instead of the usual 2-3.', role: 'Car seller' },
      ],
      faq: 'FAQ',
      faqs: [
        { q: 'How does AI text work?', a: 'Our AI copywriter analyzes your listing and rewrites it in a selling style: adds emotions, highlights benefits, structures text. Result in 5 seconds.' },
        { q: 'What does AI photographer do?', a: 'Gemini Vision analyzes your photo and auto-corrects brightness, contrast, saturation, and sharpness. Like pro editing, but instant.' },
        { q: 'What does VIP placement give?', a: 'Your listing goes to TOP for 7 days, gets a gold badge and glowing frame. On average x5 views.' },
        { q: 'Can I cancel?', a: 'Yes, anytime. First 7 days — no-questions-asked refund via Telegram Stars.' },
      ],
    },
    tr: {
      hero: 'Yapay Zeka ile Daha Hızlı Satın',
      heroSub: 'Araçlarımız ilan yanıtlarını 3-5 kat artırır. Fotoğrafçıya, metin yazarına gerek yok — yapay zeka her şeyi halleder.',
      monthly: 'Aylık',
      yearly: 'Yıllık (%20 indirim)',
      free: 'Ücretsiz',
      freePrice: '0',
      freeDesc: 'Yeni başlayanlar için',
      freeFeatures: ['Günde 3 ilan', 'Temel AI sınıflandırıcı', 'Web yayını', 'Sesli giriş'],
      pro: 'Pro',
      proPrice: '499',
      proDesc: 'Aktif satıcılar için',
      proFeatures: ['Sınırsız ilan', '✨ Ücretsiz AI metin', 'Ayda 1 VIP', 'Akışta öncelik', '7/24 Destek'],
      agency: 'Agency',
      agencyPrice: '1499',
      agencyDesc: 'Ajanslar ve işletmeler için',
      agencyFeatures: ['Pro\'daki her şey', '📸 Ücretsiz AI fotoğraf', 'Ayda 5 VIP', 'Altın rozet', 'Kişisel yönetici', 'API erişimi'],
      perMonth: '⭐ / ay',
      popular: 'Popüler',
      cta: 'Abone Ol',
      ctaFree: 'Ücretsiz Başla',
      guarantee: '7 gün koşulsuz iade',
      comparison: 'Maliyeti karşılaştırın',
      vsPhotographer: 'Profesyonel fotoğrafçı',
      vsPhotographerPrice: 'Oturum başına $50-200',
      vsCopywriter: 'Metin yazarı',
      vsCopywriterPrice: 'Metin başına $20-50',
      vsUs: 'PulseMarket AI',
      vsUsPrice: '49 ⭐ (≈ $1)',
      testimonialTitle: 'Kullanıcılarımız ne diyor',
      testimonials: [
        { name: 'Anna K.', text: 'AI metin dairem görüntülemelerini 4 kat artırdı! 2 hafta yerine 2 günde kiralandı.', role: 'Ev sahibi, Girne' },
        { name: 'Mark D.', text: 'Fotoğrafçıya nesne başına $100 ödüyordum. Artık AI bir dakikada yapıyor.', role: 'Emlak danışmanı' },
        { name: 'Elena V.', text: 'VIP ilk gün kendini amorti etti — alışılmış 2-3 yerine 12 yanıt.', role: 'Araba satıcısı' },
      ],
      faq: 'SSS',
      faqs: [
        { q: 'AI metin nasıl çalışır?', a: 'AI metin yazarımız ilanınızı analiz eder ve satış odaklı yeniden yazar: duygular ekler, avantajları vurgular. 5 saniyede sonuç.' },
        { q: 'AI fotoğrafçı ne yapar?', a: 'Gemini Vision fotoğrafınızı analiz eder ve parlaklık, kontrast, doygunluk ve keskinliği otomatik düzeltir.' },
        { q: 'VIP yerleşim ne sağlar?', a: 'İlanınız 7 gün TOP\'a çıkar, altın rozet ve parlayan çerçeve alır. Ortalama 5 kat görüntüleme.' },
        { q: 'İptal edebilir miyim?', a: 'Evet, istediğiniz zaman. İlk 7 gün — Telegram Stars üzerinden koşulsuz iade.' },
      ],
    },
  };

  const c = t[lang];
  const botUrl = 'https://t.me/BotHelpG_bot';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.3),transparent_70%)]" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[150px]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 transition-colors text-sm font-medium">
            ← {lang === 'ru' ? 'Вернуться на сайт' : lang === 'tr' ? 'Siteye dön' : 'Back to site'}
          </Link>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
            {c.hero.split(' ').map((word, i) => (
              i >= c.hero.split(' ').length - 2 
                ? <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300"> {word}</span>
                : <span key={i}> {word}</span>
            ))}
          </h1>
          <p className="text-lg md:text-xl text-indigo-200/80 max-w-2xl mx-auto leading-relaxed font-medium">
            {c.heroSub}
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* FREE */}
          <div className="relative rounded-3xl bg-slate-900/80 border border-slate-700/50 p-8 flex flex-col backdrop-blur-xl">
            <h3 className="text-2xl font-black mb-1">{c.free}</h3>
            <p className="text-slate-400 text-sm mb-6">{c.freeDesc}</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-black">{c.freePrice}</span>
              <span className="text-slate-400 text-sm">{c.perMonth}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {c.freeFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-emerald-400 mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <a href={`${botUrl}?start=publish`} target="_blank" rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl text-center font-bold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-600/50 transition-all">
              {c.ctaFree}
            </a>
          </div>

          {/* PRO — Popular */}
          <div className="relative rounded-3xl bg-gradient-to-b from-indigo-900/80 to-slate-900/80 border-2 border-indigo-500/50 p-8 flex flex-col backdrop-blur-xl shadow-[0_0_40px_rgba(99,102,241,0.2)] scale-[1.02] md:scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
              {c.popular}
            </div>
            <h3 className="text-2xl font-black mb-1">{c.pro}</h3>
            <p className="text-indigo-300/80 text-sm mb-6">{c.proDesc}</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-black text-white">{c.proPrice}</span>
              <span className="text-indigo-300/60 text-sm">{c.perMonth}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {c.proFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-indigo-100">
                  <span className="text-amber-400 mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <a href={`${botUrl}?start=plan_pro`} target="_blank" rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl text-center font-black text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all active:scale-95">
              {c.cta} 🚀
            </a>
          </div>

          {/* AGENCY */}
          <div className="relative rounded-3xl bg-gradient-to-b from-amber-950/40 to-slate-900/80 border border-amber-500/30 p-8 flex flex-col backdrop-blur-xl">
            <h3 className="text-2xl font-black mb-1">{c.agency}</h3>
            <p className="text-amber-300/60 text-sm mb-6">{c.agencyDesc}</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-black text-amber-400">{c.agencyPrice}</span>
              <span className="text-amber-400/40 text-sm">{c.perMonth}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {c.agencyFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-100/90">
                  <span className="text-amber-400 mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <a href={`${botUrl}?start=plan_agency`} target="_blank" rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl text-center font-black text-sm bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 hover:from-amber-400 hover:to-yellow-400 shadow-lg shadow-amber-500/20 transition-all active:scale-95">
              {c.cta} 🏢
            </a>
          </div>
        </div>
        
        <p className="text-center text-indigo-300/50 text-sm mt-6">🛡️ {c.guarantee}</p>
      </section>

      {/* COMPARISON TABLE */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-10">{c.comparison}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">📸</div>
            <h4 className="font-bold text-red-300 mb-1">{c.vsPhotographer}</h4>
            <p className="text-2xl font-black text-red-400">{c.vsPhotographerPrice}</p>
          </div>
          <div className="bg-orange-950/30 border border-orange-500/20 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">✍️</div>
            <h4 className="font-bold text-orange-300 mb-1">{c.vsCopywriter}</h4>
            <p className="text-2xl font-black text-orange-400">{c.vsCopywriterPrice}</p>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <div className="text-3xl mb-3">🤖</div>
            <h4 className="font-bold text-emerald-300 mb-1">{c.vsUs}</h4>
            <p className="text-2xl font-black text-emerald-400">{c.vsUsPrice}</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-10">{c.testimonialTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {c.testimonials.map((item, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6 backdrop-blur-xl">
              <p className="text-indigo-100/80 text-sm leading-relaxed mb-4 italic">"{item.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm">
                  {item.name[0]}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-10">{c.faq}</h2>
        <div className="space-y-4">
          {c.faqs.map((item, i) => (
            <details key={i} className="group bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
              <summary className="px-6 py-4 cursor-pointer flex items-center justify-between font-bold text-sm text-white hover:text-indigo-300 transition-colors">
                {item.q}
                <span className="text-indigo-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-4 text-sm text-slate-300 leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="text-center pb-20 px-4">
        <a href={`${botUrl}?start=plan_pro`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-lg px-10 py-4 rounded-2xl shadow-xl shadow-indigo-500/25 transition-all active:scale-95">
          🚀 {c.cta}
        </a>
      </section>
    </div>
  );
}
