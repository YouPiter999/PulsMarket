export const translations = {
  ru: {
    title: "Рекомендации для вас",
    subtitle: "Объявления в",
    categories: "Все категории",
    searchPlaceholder: "Поиск в объявлениях...",
    find: "Найти",
    postAd: "Подать объявление",
    business: "Для бизнеса",
    help: "Помощь",
    orders: "Заказы",
    login: "Вход и регистрация",
    promoTitle: "Весь рынок в одном боте и на этом сайте",
    promoDesc: "Наш ИИ-модератор собирает объявления из десятков групп, отсеивает спам и дубли, публикуя только качественный контент здесь и в Telegram.",
    openBot: "Открыть Telegram-бот",
    howItWorks: "Как это работает?",
    footerAbout: "О проекте",
    footerAds: "Реклама",
    footerRules: "Правила",
    footerContacts: "Контакты",
    sort: "Сортировка:",
    sortDefault: "По умолчанию",
    sortCheap: "Сначала дешевле",
    sortExp: "Сначала дороже",
    sortDate: "По дате",
    modalTitle: "Как подать объявление?",
    modalDesc: "Все объявления публикуются автоматически из ваших Telegram групп. Чтобы ваше объявление успешно появилось на сайте, просто отправьте в группу:",
    modalFieldPhoto: "📸 Реальное фото товара или услуги",
    modalFieldPrice: "💰 Цену и описание прикрепленные к фото",
    modalFieldCountry: "🌍 Все остальное сделает наш ИИ автоматически!",
    modalCTA: "Открыть Telegram-бот",
    modalClose: "Закрыть",
    statsHour: "За последний час",
    statsDay: "За последние 24 часа",
    statsNineDays: "За 9 дней (актуальные)",
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
    footerAbout: "About",
    footerAds: "Advertising",
    footerRules: "Rules",
    footerContacts: "Contacts",
    sort: "Sort by:",
    sortDefault: "Default",
    sortCheap: "Cheapest first",
    sortExp: "Most expensive first",
    sortDate: "By date",
    modalTitle: "How to post an ad?",
    modalDesc: "All ads are published automatically from your Telegram groups. For your ad to successfully appear on the site, simply send to the group:",
    modalFieldPhoto: "📸 A real photo of the product or service",
    modalFieldPrice: "💰 Price and description attached to the photo",
    modalFieldCountry: "🌍 Our AI will do the rest automatically!",
    modalCTA: "Open Telegram Bot",
    modalClose: "Close",
    statsHour: "In the last hour",
    statsDay: "In the last 24 hours",
    statsNineDays: "In the last 9 days (relevant)",
  },
  tr: {
    title: "Sizin için öneriler",
    subtitle: "İlanlar:",
    categories: "Tüm kategoriler",
    searchPlaceholder: "İlanlarda ara...",
    find: "Bul",
    postAd: "İlan ver",
    business: "İşletmeler için",
    help: "Yardım",
    orders: "Siparişler",
    login: "Giriş ve kayıt",
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
    statsHour: "Son bir saatte",
    statsDay: "Son 24 saatte",
    statsNineDays: "Son 9 günde (güncel)",
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

export function translateListingText(text: string, targetLang: string) {
  if (!text) return '';
  if (targetLang === 'tr') return text;
  let translated = text;
  
  const sortedKeys = Object.keys(titleDictionary).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const translation = titleDictionary[key][targetLang as 'ru' | 'en'];
    const regex = new RegExp(key.replace(/İ/g, '[İiıI]').replace(/Ş/g, '[Şş]').replace(/Ç/g, '[Çç]').replace(/Ü/g, '[Üü]').replace(/Ö/g, '[Öö]').replace(/Ğ/g, '[Ğğ]'), 'gi');
    translated = translated.replace(regex, translation);
  }
  return translated;
}

export function getListingSubcategory(title: string = '', description: string = '', category: string = 'Недвижимость', price: number = 0): string {
  const text = (title + ' ' + (description || '')).toLowerCase();
  
  if (text.includes('сниму') || text.includes('ищу аренду') || text.includes('ищем квартиру') || text.includes('kiralık arıyorum') || text.includes('want to rent') || text.includes('looking for rent')) {
    return 'Сниму';
  }
  if (text.includes('куплю') || text.includes('ищу покупку') || text.includes('хочу купить') || text.includes('satılık arıyorum') || text.includes('want to buy') || text.includes('looking to buy')) {
    return 'Куплю';
  }
  if (
    text.includes('сдам') || text.includes('сдаю') || text.includes('сдаётся') || text.includes('аренда') || 
    text.includes('rent a car') || text.includes('car rental') || text.includes('kiralık') || 
    text.includes('kiralik') || text.includes('for rent') || text.includes('прокат') ||
    text.includes('аренду')
  ) {
    return 'Сдаю';
  }
  if (text.includes('продам') || text.includes('продаю') || text.includes('продается') || text.includes('продаётся') || text.includes('продажа') || text.includes('satılık') || text.includes('satilik') || text.includes('sale') || text.includes('for sale')) {
    return 'Продам';
  }
  if (category === 'Транспорт' && price > 0 && price < 2500) {
     return 'Сдаю';
  }
  if (category === 'Транспорт') {
     return 'Продам';
  }
  return 'Сдаю';
}
