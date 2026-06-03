'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';

/* ──────────── helpers ──────────── */
function AnimatedCounter({ target, suffix = '', duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${Math.round(v).toLocaleString()}${suffix}`);
  useEffect(() => { if (isInView) animate(count, target, { duration, ease: 'easeOut' }); }, [isInView, target, count, duration]);
  return <motion.span ref={ref}>{rounded}</motion.span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
};

/* ──────────── translations (old pricing) ──────────── */
const t = {
  ru: {
    hero: 'Продавайте быстрее с ИИ',
    heroSub: 'Наши инструменты увеличивают отклики на объявления в 3-5 раз. Без фотографа, без копирайтера — всё делает искусственный интеллект.',
    monthly: 'Ежемесячно', yearly: 'Годовой (скидка 20%)',
    free: 'Бесплатный', freePrice: '0', freeDesc: 'Для тех, кто только начинает',
    freeFeatures: ['3 объявления в день', 'Базовый ИИ-классификатор', 'Публикация на сайте', 'Голосовой ввод'],
    pro: 'Pro', proPrice: '499', proDesc: 'Для активных продавцов',
    proFeatures: ['Безлимит объявлений', '✨ AI-текст бесплатно', '1 VIP-размещение / мес', 'Приоритет в ленте', 'Поддержка 24/7'],
    agency: 'Agency', agencyPrice: '1499', agencyDesc: 'Для агентств и бизнеса',
    agencyFeatures: ['Всё из Pro', '📸 AI-фото бесплатно', '5 VIP-размещений / мес', 'Золотой бэйдж на карточках', 'Персональный менеджер', 'API доступ'],
    perMonth: '⭐ / мес', popular: 'Популярный', cta: 'Подключить', ctaFree: 'Начать бесплатно',
    guarantee: '7 дней возврат без вопросов',
    comparison: 'Сравните стоимость',
    vsPhotographer: 'Профессиональный фотограф', vsPhotographerPrice: '$50-200 за сессию',
    vsCopywriter: 'Копирайтер', vsCopywriterPrice: '$20-50 за текст',
    vsUs: 'PulseMarket AI', vsUsPrice: '49 ⭐ (≈ $1)',
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
    mediakitTitle: 'Медиакит для рекламодателей',
    forSellers: 'Для продавцов',
    forBusiness: 'Для бизнеса / рекламодателей',
  },
  en: {
    hero: 'Sell Faster with AI',
    heroSub: 'Our tools increase listing responses by 3-5x. No photographer, no copywriter — AI handles everything.',
    monthly: 'Monthly', yearly: 'Yearly (20% off)',
    free: 'Free', freePrice: '0', freeDesc: 'For those just starting',
    freeFeatures: ['3 listings/day', 'Basic AI classifier', 'Website publishing', 'Voice input'],
    pro: 'Pro', proPrice: '499', proDesc: 'For active sellers',
    proFeatures: ['Unlimited listings', '✨ Free AI text', '1 VIP/month', 'Feed priority', '24/7 Support'],
    agency: 'Agency', agencyPrice: '1499', agencyDesc: 'For agencies & business',
    agencyFeatures: ['Everything in Pro', '📸 Free AI photos', '5 VIP/month', 'Gold badge', 'Personal manager', 'API access'],
    perMonth: '⭐ / mo', popular: 'Popular', cta: 'Subscribe', ctaFree: 'Start Free',
    guarantee: '7-day money-back guarantee',
    comparison: 'Compare the cost',
    vsPhotographer: 'Professional photographer', vsPhotographerPrice: '$50-200 per session',
    vsCopywriter: 'Copywriter', vsCopywriterPrice: '$20-50 per text',
    vsUs: 'PulseMarket AI', vsUsPrice: '49 ⭐ (≈ $1)',
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
    mediakitTitle: 'Media Kit for Advertisers',
    forSellers: 'For Sellers',
    forBusiness: 'For Business / Advertisers',
  },
  tr: {
    hero: 'Yapay Zeka ile Daha Hızlı Satın',
    heroSub: 'Araçlarımız ilan yanıtlarını 3-5 kat artırır. Fotoğrafçıya, metin yazarına gerek yok — yapay zeka her şeyi halleder.',
    monthly: 'Aylık', yearly: 'Yıllık (%20 indirim)',
    free: 'Ücretsiz', freePrice: '0', freeDesc: 'Yeni başlayanlar için',
    freeFeatures: ['Günde 3 ilan', 'Temel AI sınıflandırıcı', 'Web yayını', 'Sesli giriş'],
    pro: 'Pro', proPrice: '499', proDesc: 'Aktif satıcılar için',
    proFeatures: ['Sınırsız ilan', '✨ Ücretsiz AI metin', 'Ayda 1 VIP', 'Akışta öncelik', '7/24 Destek'],
    agency: 'Agency', agencyPrice: '1499', agencyDesc: 'Ajanslar ve işletmeler için',
    agencyFeatures: ['Pro\'daki her şey', '📸 Ücretsiz AI fotoğraf', 'Ayda 5 VIP', 'Altın rozet', 'Kişisel yönetici', 'API erişimi'],
    perMonth: '⭐ / ay', popular: 'Popüler', cta: 'Abone Ol', ctaFree: 'Ücretsiz Başla',
    guarantee: '7 gün koşulsuz iade',
    comparison: 'Maliyeti karşılaştırın',
    vsPhotographer: 'Profesyonel fotoğrafçı', vsPhotographerPrice: 'Oturum başına $50-200',
    vsCopywriter: 'Metin yazarı', vsCopywriterPrice: 'Metin başına $20-50',
    vsUs: 'PulseMarket AI', vsUsPrice: '49 ⭐ (≈ $1)',
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
    mediakitTitle: 'Reklamverenler için Medya Kiti',
    forSellers: 'Satıcılar için',
    forBusiness: 'İşletmeler / Reklamverenler için',
  },
};

/* ──────────── mediakit data ──────────── */
const mkStats = [
  { value: 708, suffix: '+', label: 'Активных объявлений' },
  { value: 85, suffix: '', label: 'Новых за 24ч' },
  { value: 50, suffix: '+', label: 'Telegram-групп' },
  { value: 390, suffix: '', label: 'Недвижимость' },
];

const packages = [
  { name: 'STARTER', desc: '1 баннер Sidebar (7 дней) + статистика', old: '149€', now: '14.90€', after: '29.80€', color: 'border-slate-600/40', bg: 'bg-slate-900/60', badge: null, popular: false },
  { name: 'LOCAL', desc: '2 баннера (Top + Sidebar, 7 дней) + 1 Telegram пост + UTM-трекинг', old: '279€', now: '27.90€', after: '55.80€', color: 'border-blue-500/30', bg: 'bg-blue-950/30', badge: null, popular: false },
  { name: 'PRO', desc: '3 места (Top, Sidebar, In-Feed, 30 дней) + 2 Telegram поста + CTA-кнопки', old: '899€', now: '89.90€', after: '179.80€', color: 'border-indigo-500/40', bg: 'bg-indigo-950/30', badge: '⚡ Популярный', popular: true },
  { name: 'EXCLUSIVE', desc: 'Category Sponsor (30 дней) + 4 Telegram поста + приоритет + менеджер + дизайн', old: '1999€', now: '199.90€', after: '399.80€', color: 'border-amber-500/30', bg: 'bg-amber-950/20', badge: '👑 Максимум', popular: false },
];

const adFormats = [
  { format: 'Top Banner', placement: 'Верх главной страницы', term: '7 дней', old: '199€', now: '19.90€', after: '39.80€' },
  { format: 'Sidebar Banner', placement: 'Правая колонка всех страниц', term: '30 дней', old: '599€', now: '59.90€', after: '119.80€' },
  { format: 'In-Feed Native Ad', placement: 'Внутри ленты объявлений', term: '7 дней', old: '149€', now: '14.90€', after: '29.80€' },
  { format: 'Category Sponsor', placement: 'Топ одной категории (без конкурентов)', term: '30 дней', old: '799€', now: '79.90€', after: '159.80€' },
  { format: 'Telegram Post', placement: 'Пост в канале NorthCyprus_Island', term: '1 пост', old: '99€', now: '9.90€', after: '19.80€' },
  { format: 'Combo (Web + Telegram)', placement: 'Баннер на сайте + пост в Telegram', term: '7 дней', old: '299€', now: '29.90€', after: '59.80€' },
  { format: 'Exclusive Category Lock', placement: 'Эксклюзив в категории на месяц', term: '30 дней', old: '1499€', now: '149.90€', after: '299.80€' },
];

const businessCategories = [
  { type: '🏠 Недвижимость', examples: 'Агентства, застройщики, управление недвижимостью', pkg: 'PRO / EXCLUSIVE' },
  { type: '🚗 Автомобили', examples: 'Автосалоны, СТО, rent-a-car', pkg: 'PRO' },
  { type: '🍽️ Рестораны/Кафе', examples: 'Доставка еды, кафе, бары', pkg: 'LOCAL' },
  { type: '💆 Красота/Здоровье', examples: 'Салоны красоты, барбершопы, стоматологии', pkg: 'LOCAL / STARTER' },
  { type: '📚 Образование', examples: 'Языковые школы, детские центры, курсы', pkg: 'LOCAL' },
  { type: '🔧 Ремонт/Строительство', examples: 'Бригады, магазины стройматериалов', pkg: 'STARTER / LOCAL' },
  { type: '⚖️ Финансы/Юристы', examples: 'Банки, страховые, адвокаты', pkg: 'PRO' },
  { type: '✈️ Туризм', examples: 'Туроператоры, экскурсии, отели', pkg: 'LOCAL / PRO' },
];

const addServices = [
  { service: 'Дизайн креатива', old: '49€', now: '4.90€', after: '9.80€' },
  { service: 'Копирайтинг текста', old: '39€', now: '3.90€', after: '7.80€' },
  { service: 'Лид-форма на баннере', old: '79€', now: '7.90€', after: '15.80€' },
  { service: 'A/B тестирование (2 варианта)', old: '99€', now: '9.90€', after: '19.80€' },
  { service: 'Видео-креатив (до 15 сек)', old: '149€', now: '14.90€', after: '29.80€' },
  { service: 'Ретаргетинг (повторный показ)', old: '199€', now: '19.90€', after: '39.80€' },
];

/* ──────────── component ──────────── */
export default function PricingPage() {
  const [lang, setLang] = useState<'ru' | 'en' | 'tr'>('ru');
  const [tab, setTab] = useState<'sellers' | 'business'>('business');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const bl = navigator.language.split('-')[0];
    if (bl === 'tr') setLang('tr');
    else if (bl === 'en') setLang('en');
    else setLang('ru');
  }, []);

  const c = t[lang];
  const botUrl = 'https://t.me/BotHelpG_bot';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">

      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.3),transparent_70%)]" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[150px]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 transition-colors text-sm font-medium">
            ← {lang === 'ru' ? 'Вернуться на сайт' : lang === 'tr' ? 'Siteye dön' : 'Back to site'}
          </Link>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
            {c.hero.split(' ').map((word, i) => (
              i >= c.hero.split(' ').length - 2
                ? <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300"> {word}</span>
                : <span key={i}> {word}</span>
            ))}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-indigo-200/80 max-w-2xl mx-auto leading-relaxed font-medium">
            {c.heroSub}
          </motion.p>

          {/* TAB SWITCHER */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-10 inline-flex bg-slate-900/70 border border-slate-700/50 rounded-xl p-1 backdrop-blur-xl">
            <button onClick={() => setTab('sellers')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'sellers' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              {c.forSellers}
            </button>
            <button onClick={() => setTab('business')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'business' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              {c.forBusiness}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ═══════ TAB: SELLERS (old pricing) ═══════ */}
      {/* ═══════════════════════════════════════════════════ */}
      {tab === 'sellers' && (
        <motion.div key="sellers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

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
                  className="w-full py-3.5 rounded-xl text-center font-bold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-600/50 transition-all block">
                  {c.ctaFree}
                </a>
              </div>

              {/* PRO */}
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
                  className="w-full py-3.5 rounded-xl text-center font-black text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all active:scale-95 block">
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
                  className="w-full py-3.5 rounded-xl text-center font-black text-sm bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 hover:from-amber-400 hover:to-yellow-400 shadow-lg shadow-amber-500/20 transition-all active:scale-95 block">
                  {c.cta} 🏢
                </a>
              </div>
            </div>
            <p className="text-center text-indigo-300/50 text-sm mt-6">🛡️ {c.guarantee}</p>
          </section>

          {/* COMPARISON */}
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
                  <p className="text-indigo-100/80 text-sm leading-relaxed mb-4 italic">&quot;{item.text}&quot;</p>
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
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ═══════ TAB: BUSINESS (mediakit) ═══════ */}
      {/* ═══════════════════════════════════════════════════ */}
      {tab === 'business' && (
        <motion.div key="business" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          {/* MEDIAKIT INTRO */}
          <section className="py-12 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                className="inline-block mb-6">
                <span className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">
                  📄 Медиакит PulseMarket
                </span>
              </motion.div>
              <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
                className="text-3xl md:text-5xl font-black mb-6">
                Ваш рекламный бюджет{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">больше не сгорает</span>
                {' '}в Telegram-чатах
              </motion.h2>
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
                className="text-slate-300/80 text-lg max-w-3xl mx-auto leading-relaxed">
                Вы публикуете в десятках местных групп, а через 5 минут объявление уже тонет под спамом, фейками и сообщениями без цены. Вы тратите деньги, время и силы, но реальных покупателей почти не видите.
              </motion.p>
            </div>
          </section>

          {/* PROBLEM + SOLUTION */}
          <section className="py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                className="bg-red-950/15 border border-red-500/15 rounded-2xl p-8 text-center">
                <p className="text-slate-300 leading-relaxed">
                  Модель Telegram-рынков сломана: в ней слишком много мусора, неактуальных объявлений и сомнительных продавцов. В такой среде хорошие предложения просто теряются.
                </p>
              </motion.div>
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
                className="bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border border-indigo-500/20 rounded-2xl p-8 backdrop-blur-xl text-center">
                <p className="text-indigo-100 text-lg leading-relaxed font-semibold">
                  <strong className="text-emerald-400">Мы решили эту проблему.</strong>{' '}
                  <a href="https://pulsemarket-group-app.web.app/" target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:text-amber-200 underline decoration-amber-500/30 underline-offset-4">PulseMarket</a> — это платформа, которая собирает объявления из 50+ крупнейших Telegram-групп. Наш ИИ-модератор круглосуточно отсекает спам, скрытые контакты, объявления без цены и публикации старше 9 дней.
                </p>
              </motion.div>
            </div>
          </section>

          {/* STATS */}
          <section className="py-14 px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mkStats.map((s, i) => (
                  <motion.div key={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                    <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6 text-center backdrop-blur-xl hover:border-indigo-500/40 transition-all duration-500">
                      <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        <AnimatedCounter target={s.value} suffix={s.suffix} />
                      </div>
                      <div className="text-xs sm:text-sm text-slate-400 font-medium">{s.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <p className="text-center text-sm text-slate-500 mt-4">Категории: Недвижимость, Транспорт, Услуги, Работа, Товары • Кирения, Фамагуста, Никосия</p>
            </div>
          </section>

          {/* WHY IT WORKS */}
          <section className="py-14 px-4">
            <div className="max-w-4xl mx-auto">
              <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                className="text-3xl md:text-4xl font-black text-center mb-8">
                Почему это работает для вашего бизнеса
              </motion.h2>
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
                className="bg-slate-900/50 border border-slate-700/30 rounded-2xl p-8 mb-6">
                <p className="text-slate-200 leading-relaxed">Ваше объявление не тонет в шуме. Оно показывается в чистой, премиальной среде без спама и мусора. Покупатели приходят уже с намерением купить. Им не нужно просматривать десятки чатов — они видят лучшие предложения сразу.</p>
              </motion.div>
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
                className="bg-gradient-to-r from-amber-950/30 to-yellow-950/20 border-2 border-amber-500/25 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/8 rounded-full blur-[80px]" />
                <p className="text-amber-100 leading-relaxed font-bold text-base md:text-lg relative z-10">
                  Вы получаете международную аудиторию. Русский текст автоматически переводится на английский и турецкий, чтобы объявление было понятно экспатам и местным жителям. Охват растёт без лишних затрат. Один и тот же креатив работает сразу на несколько языковых сегментов Северного Кипра.
                </p>
              </motion.div>
            </div>
          </section>

          {/* TWO TYPES */}
          <section className="py-14 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                className="text-2xl md:text-3xl font-black mb-6">На этом рынке есть два типа рекламодателей</motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                  className="bg-red-950/15 border border-red-500/15 rounded-2xl p-6">
                  <div className="text-3xl mb-3">😓</div>
                  <p className="text-slate-300 text-sm">Первые по-прежнему сливают бюджет в мёртвые чаты.</p>
                </motion.div>
                <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
                  className="bg-emerald-950/15 border border-emerald-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
                  <div className="text-3xl mb-3">🚀</div>
                  <p className="text-slate-300 text-sm">Вторые размещаются на очищенной AI-платформе и получают внимание покупателей, которые готовы действовать прямо сейчас.</p>
                </motion.div>
              </div>
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
                className="text-indigo-300 font-bold mt-8 text-lg">Хотите, чтобы ваш продукт видели не случайные люди, а те, кто реально ищет его сегодня?</motion.p>
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3}
                className="text-slate-400 mt-2">Давайте обсудим формат размещения.</motion.p>
            </div>
          </section>

          {/* SPECIAL OFFER */}
          <section className="py-14 px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                className="relative bg-gradient-to-r from-red-950/30 via-rose-950/20 to-red-950/30 border-2 border-red-500/25 rounded-3xl p-8 md:p-12 text-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08),transparent_60%)]" />
                <div className="relative z-10 text-center">
                  <span className="inline-block bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-black px-5 py-2 rounded-full mb-4">🚀 СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ</span>
                  <h2 className="text-3xl md:text-5xl font-black mb-6">Специальное предложение — скидка 90% СЕЙЧАС</h2>
                  <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-4"><strong className="text-white">Сейчас можно оплатить любой период размещения с текущей скидкой 90%.</strong></p>
                  <p className="text-slate-400 mb-6">После окончания акции цена вернётся к скидке <strong className="text-amber-400">80%</strong>.</p>
                  <p className="text-indigo-200/80 text-sm max-w-lg mx-auto font-medium">Это возможность протестировать платформу, увидеть результат и перейти на долгосрочное сотрудничество по максимальной выгоде.</p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* PACKAGES */}
          <section className="py-20 px-4 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.08),transparent_60%)]" />
            <div className="max-w-6xl mx-auto relative z-10">
              <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                className="text-3xl md:text-4xl font-black text-center mb-2">Пакетные <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">предложения</span></motion.h2>
              <p className="text-slate-400 text-center mb-12 text-sm">Со скидкой 90% сейчас / 80% после акции</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {packages.map((pkg, i) => (
                  <motion.div key={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                    className={`relative rounded-2xl p-6 flex flex-col backdrop-blur-xl transition-all ${pkg.bg} border ${pkg.color} ${pkg.popular ? 'shadow-[0_0_50px_rgba(99,102,241,0.12)] ring-1 ring-indigo-500/20' : ''}`}>
                    {pkg.badge && (
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${pkg.popular ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950'} text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider whitespace-nowrap`}>
                        {pkg.badge}
                      </div>
                    )}
                    <h3 className="text-xl font-black mb-2 mt-1">{pkg.name}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-5 flex-1">{pkg.desc}</p>
                    <div className="space-y-1 mb-5">
                      <div className="text-slate-500 line-through text-sm">{pkg.old}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">{pkg.now}</span>
                        <span className="bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full">−90%</span>
                      </div>
                      <div className="text-xs text-slate-500">После: <span className="text-amber-400/80">{pkg.after}</span></div>
                    </div>
                    <a href={`${botUrl}?start=advertise`} target="_blank" rel="noopener noreferrer"
                      className={`w-full py-3 rounded-xl text-center font-bold text-sm transition-all active:scale-95 block ${pkg.popular ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 hover:bg-slate-700 border border-slate-600/40 text-white'}`}>
                      Выбрать →
                    </a>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* AD FORMATS TABLE */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                className="text-3xl md:text-4xl font-black text-center mb-2">Отдельные рекламные <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">форматы</span></motion.h2>
              <p className="text-slate-400 text-center mb-10 text-sm">Со скидкой 90% сейчас / 80% после акции</p>
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-4 px-3 text-slate-400 font-medium">Формат</th>
                      <th className="text-left py-4 px-3 text-slate-400 font-medium hidden md:table-cell">Размещение</th>
                      <th className="text-center py-4 px-3 text-slate-400 font-medium">Срок</th>
                      <th className="text-center py-4 px-3 text-slate-500 font-medium">Цена</th>
                      <th className="text-center py-4 px-3 text-red-400 font-bold">90% 🔥</th>
                      <th className="text-center py-4 px-3 text-amber-400 font-medium">80%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adFormats.map((f, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-3 font-bold text-white">{f.format}</td>
                        <td className="py-4 px-3 text-slate-400 hidden md:table-cell">{f.placement}</td>
                        <td className="py-4 px-3 text-center text-slate-300">{f.term}</td>
                        <td className="py-4 px-3 text-center text-slate-500 line-through">{f.old}</td>
                        <td className="py-4 px-3 text-center font-black text-white">{f.now}</td>
                        <td className="py-4 px-3 text-center text-amber-400/70">{f.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            </div>
          </section>

          {/* BUSINESS CATEGORIES */}
          <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
              <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                className="text-3xl md:text-4xl font-black text-center mb-10">Целевые категории <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">бизнеса</span></motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {businessCategories.map((cat, i) => (
                  <motion.div key={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5 backdrop-blur-xl hover:border-emerald-500/25 transition-all">
                    <div className="text-lg font-bold mb-2">{cat.type}</div>
                    <p className="text-slate-400 text-xs mb-3">{cat.examples}</p>
                    <span className="inline-block bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full">{cat.pkg}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ADDITIONAL SERVICES */}
          <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto">
              <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                className="text-3xl md:text-4xl font-black text-center mb-2">Доп. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">услуги</span></motion.h2>
              <p className="text-slate-400 text-center mb-10 text-sm">Со скидкой 90% сейчас / 80% после акции</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addServices.map((s, i) => (
                  <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                    className="bg-slate-900/40 border border-slate-700/30 rounded-xl p-5 flex items-center justify-between hover:border-purple-500/25 transition-colors">
                    <div>
                      <div className="font-bold text-sm text-white">{s.service}</div>
                      <div className="text-xs text-slate-500 line-through">{s.old}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-white">{s.now}</div>
                      <div className="text-[10px] text-amber-400/60">После: {s.after}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* HOW TO START */}
          <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto">
              <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                className="text-3xl md:text-4xl font-black text-center mb-10">Как <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">начать</span></motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { step: '1', title: 'Выберите формат', desc: 'Пакет или отдельный формат', icon: '📋' },
                  { step: '2', title: 'Согласуйте', desc: 'Получите предложение и креатив', icon: '🤝' },
                  { step: '3', title: 'Оплатите', desc: 'Скидка 90% сейчас (после акции — 80%)', icon: '💳' },
                  { step: '4', title: 'Запуск', desc: 'В течение 24 часов', icon: '🚀' },
                ].map((s, i) => (
                  <motion.div key={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                    className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-6 text-center hover:border-amber-500/25 transition-colors">
                    <div className="text-3xl mb-3">{s.icon}</div>
                    <div className="text-amber-400 text-xs font-bold mb-1">ШАГ {s.step}</div>
                    <div className="font-bold text-white text-sm mb-1">{s.title}</div>
                    <div className="text-slate-400 text-xs">{s.desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* MEDIAKIT FAQ */}
          <section className="py-16 px-4">
            <div className="max-w-3xl mx-auto">
              <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                className="text-3xl font-black text-center mb-10">Частые <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">вопросы</span></motion.h2>
              <div className="space-y-3">
                {[
                  { q: 'Чем PulseMarket отличается от Telegram-группы?', a: 'PulseMarket — структурированный маркетплейс с ИИ-модерацией, фильтрами, категориями и ценами. В обычной группе объявление тонет за минуты. У нас — живёт неделями.' },
                  { q: 'Почему такие скидки?', a: 'Мы в стадии раннего роста. Скидка 90% — для первых рекламодателей. После набора аудитории останется скидка 80%.' },
                  { q: 'Как быстро запускается размещение?', a: 'В течение 24 часов после оплаты и согласования креатива.' },
                  { q: 'На каких языках работает платформа?', a: 'Русский, English, Türkçe — автоопределение. Русский текст автоматически переводится на английский и турецкий.' },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                    className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-sm text-white hover:text-indigo-300 transition-colors">
                      <span>{item.q}</span>
                      <motion.span animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.3 }} className="text-indigo-400 shrink-0 ml-4">▼</motion.span>
                    </button>
                    <motion.div initial={false} animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
                      <div className="px-6 pb-5 text-sm text-slate-300 leading-relaxed">{item.a}</div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="py-24 px-4 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_50%)]" />
            <div className="max-w-3xl mx-auto text-center relative z-10">
              <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                className="text-3xl md:text-5xl font-black mb-4">
                Готовы перестать <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">сжигать бюджет?</span>
              </motion.h2>
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
                className="text-white font-bold text-lg mb-2">Сейчас можно оплатить любой период размещения с текущей скидкой 90%.</motion.p>
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
                className="text-slate-400 mb-10">После окончания акции цена вернётся к скидке 80%.</motion.p>
              <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3}
                className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href={`${botUrl}?start=advertise`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-lg px-10 py-4 rounded-2xl shadow-xl shadow-indigo-500/25 transition-all active:scale-95">
                  💬 Обсудить размещение
                </a>
                <a href="https://pulsemarket-group-app.web.app/" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-white font-bold text-sm px-8 py-4 rounded-2xl transition-all">
                  🌐 Посмотреть платформу
                </a>
              </motion.div>
              <p className="text-slate-600 text-xs mt-10">PulseMarket — #1 маркетплейс Северного Кипра • pulsemarket-group-app.web.app</p>
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
}
