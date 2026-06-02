// src/lib/categoryClassifier.ts

function hasWord(text: string, word: string): boolean {
  const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(?:^|[^a-zA-Z0-9а-яёА-ЯЁ_])${escaped}(?:$|[^a-zA-Z0-9а-яёА-ЯЁ_])`, 'i');
  return regex.test(text);
}

function hasAnyWord(text: string, words: string[]): boolean {
  return words.some(word => hasWord(text, word));
}

export function getCategoryNuclear(title: string, description: string, currentCategory?: string): string {
  const titleLower = title.toLowerCase();
  const text = (title + " " + description).toLowerCase();

  // 1. Новости
  if (text.includes("новости") || text.includes("прогноз погоды") || text.includes("курс лиры") || currentCategory === "Новости") {
    return "Новости";
  }

  // 2. Списки ключевых слов с точным сопоставлением границ слов
  const transportBrands = [
    "bmw", "audi", "mercedes", "toyota", "nissan", "honda", "mazda", "ford", "vw", "kia", "hyundai", "tesla", "porsche", "мерседес", "lexus", "jeep", "range rover", "land rover", "yamaha", "suzuki", "ducati", "kawasaki", "sym", "hyosung", "aprillia", "vespa", "piaggio", "kymco", "harley"
  ];

  const transportGeneric = [
    "авто", "автомобиль", "автомобиля", "автомобили", "автомобилей",
    "машина", "машину", "машины", "машин", "мотоцикл", "мотоцикла", "мотоциклы",
    "скутер", "скутера", "скутеры", "скутеров", "квадроцикл", "квадроцикла", "квадроциклы",
    "велосипед", "велосипеды", "лодка", "катер", "багги",
    "scooter", "car", "cars", "motorcycle", "bike", "auto"
  ];

  const carRentKeywords = ["аренда авто", "прокат авто", "сниму авто", "аренда машин", "прокат машин", "rent a car", "car rent"];

  const elecWords = [
    "iphone", "ipad", "ноутбук", "ноутбука", "ноутбуки", "macbook", "телевизор", "телевизора", "телевизоры",
    "смартфон", "смартфона", "смартфоны", "пылесос", "playstation", "xbox",
    "телефон", "телефона", "телефоны", "наушники", "наушников", "apple watch",
    "геймпад", "джойстик", "колонки", "колонка", "клавиатура", "мышка", "мышь",
    "пк", "pc", "тв", "tv", "laptop", "computer", "компьютер", "компьютера", "компьютеры",
    "принтер", "монитор", "экран", "планшет", "планшета", "планшеты"
  ];

  const clothingWords = [
    "платье", "платья", "обувь", "обуви", "одежда", "одежды", "куртка", "куртку", "куртки",
    "штаны", "штанов", "кроссовки", "кроссовок", "сумка", "сумку", "сумки", "сумок",
    "футболка", "футболку", "футболки", "джинсы", "джинсов", "юбка", "юбку", "юбки",
    "костюм", "костюмы", "сапоги", "туфли", "рюкзак", "рюкзаки",
    "dress", "shoes", "clothes", "jacket", "sneakers", "bag", "bags", "jeans"
  ];

  const furnitureWords = [
    "диван", "диваны", "шкаф", "шкафы", "стол", "столы", "стул", "стулья",
    "кровать", "кровати", "матрас", "матрасы", "кухня", "кухни", "комод", "комоды",
    "тумба", "тумбы", "кресло", "кресла", "стеллаж", "стеллажи", "гриль", "мангал",
    "люстра", "люстры", "зеркало", "зеркала",
    "sofa", "wardrobe", "table", "chair", "chairs", "bed", "mattress", "kitchen"
  ];

  const absoluteHousingKeywords = [
    "квартира", "квартиру", "квартиры", "квартире", "квартир",
    "апартаменты", "апартаментов", "apartment", "apartments",
    "вилла", "виллу", "виллы", "вилле", "вилл", "villa", "villas",
    "пентхаус", "пентхауса", "пентхаусы", "penthouse",
    "таунхаус", "таунхаусы", "townhouse", "townhouses",
    "участок", "участка", "участки", "участком", "land",
    "земля", "земли", "землю", "земельный",
    "дом", "дома", "дому", "домом", "доме", "домов", "house", "houses", "home"
  ];

  const weakHousingKeywords = [
    "офис", "офиса", "офисы", "office", "offices",
    "магазин", "магазина", "магазины", "shop",
    "студия", "студию", "студии", "studio", "studios",
    "спальня", "спальни", "bedroom", "bedrooms",
    "flat", "flats", "loft", "resort", "резорт"
  ];

  const jobWords = [
    "вакансия", "вакансии", "требуется", "требуются", "работа", "работу", "работы", "работе",
    "job", "vacancy", "vacancies", "hiring", "work"
  ];

  const jobPhrases = [
    "ищу работу", "ищем сотрудника", "набираем команду", "ищу сотрудника", "в автосервис требуется", "в ресторан требуется", "требуются сотрудники"
  ];

  const servicesKeywords = [
    "услуги", "услуга", "массаж", "клининг", "уборка", 
    "нотариус", "адвокат", "репетитор", "маникюр", "педикюр", "косметолог",
    "парикмахер", "визажист", "электрик", "сантехник", "грузчик", "грузчики", "переезд", "переезды",
    "грузоперевозки", "перевозка вещей", "перевозка мебели", "химчистка", "няня", "няни", "услуги няни",
    "massage", "cleaning", "delivery"
  ];

  // 3. Вычисление сигналов
  const hasTransportBrand = hasAnyWord(text, transportBrands);
  const hasTransportGeneric = hasAnyWord(text, transportGeneric);
  const hasCarRentSignal = hasAnyWord(text, carRentKeywords);
  const isTransportSignal = hasTransportBrand || hasTransportGeneric || hasCarRentSignal;

  const hasElecBrandOrGeneric = hasAnyWord(text, elecWords);
  const hasClothingSignal = hasAnyWord(text, clothingWords);
  const hasFurnitureSignal = hasAnyWord(text, furnitureWords);

  const hasGoodsSignal = isTransportSignal || hasElecBrandOrGeneric || hasClothingSignal || hasFurnitureSignal;

  // Очистка текста от брендов и товаров для исключения ложных срабатываний недвижимости/услуг/работы
  let cleanTextForHousingAndJobs = text;
  const wordsToStrip = [...transportBrands, ...transportGeneric, ...elecWords, ...clothingWords, ...furnitureWords];
  for (const word of wordsToStrip) {
    const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9а-яёА-ЯЁ_])${escaped}(?:$|[^a-zA-Z0-9а-яёА-ЯЁ_])`, 'gi');
    cleanTextForHousingAndJobs = cleanTextForHousingAndJobs.replace(regex, ' ');
  }

  const hasAbsoluteHousing = hasAnyWord(cleanTextForHousingAndJobs, absoluteHousingKeywords) || /\b\d\+\d\b/.test(cleanTextForHousingAndJobs);
  const hasWeakHousing = hasAnyWord(cleanTextForHousingAndJobs, weakHousingKeywords) && !hasGoodsSignal;
  const hasStrictHousing = hasAbsoluteHousing || hasWeakHousing;

  const hasCoarseHousing = hasAnyWord(cleanTextForHousingAndJobs, ["сдам", "сдаю", "сниму", "аренда", "rent"]);
  const hasHousingSignal = hasStrictHousing || (hasCoarseHousing && !hasGoodsSignal);

  const isSellingGoods = hasAnyWord(text, ["продам", "продаю", "продается", "продаётся", "состояние", "оригинал", "б/у", "новые", "новый", "sale", "sell", "condition"]);

  const hasJobKeywords = hasAnyWord(cleanTextForHousingAndJobs, jobWords) || jobPhrases.some(p => cleanTextForHousingAndJobs.includes(p));

  const hasServicesKeywords = hasAnyWord(cleanTextForHousingAndJobs, servicesKeywords);
  const hasRepairWord = hasWord(cleanTextForHousingAndJobs, "ремонт");
  const hasDeliveryWord = hasWord(cleanTextForHousingAndJobs, "доставка") || hasWord(cleanTextForHousingAndJobs, "доставку") || hasWord(cleanTextForHousingAndJobs, "доставкой");

  const isServices = (hasServicesKeywords || (hasRepairWord && !isSellingGoods) || (hasDeliveryWord && !isSellingGoods)) && !isSellingGoods;
  const isJob = hasJobKeywords && !isServices && !isSellingGoods;

  const isParkingOrGarageOnly = (hasAnyWord(cleanTextForHousingAndJobs, ["парковка", "паркинг", "гараж", "стоянка"]) || 
                                 /место для (?:авто|машины|машин)/.test(cleanTextForHousingAndJobs) ||
                                 /парковочное место/.test(cleanTextForHousingAndJobs)) && 
                                !hasTransportBrand && 
                                !hasCarRentSignal;

  const isTransport = isTransportSignal && !isParkingOrGarageOnly;

  // 4. Приоритеты классификации по заголовку ( supreme confidence )
  if (hasAnyWord(titleLower, absoluteHousingKeywords) || /\b\d\+\d\b/.test(titleLower)) return "Недвижимость";
  if (hasAnyWord(titleLower, transportBrands) || hasAnyWord(titleLower, transportGeneric)) return "Транспорт";
  if (hasAnyWord(titleLower, elecWords)) return "Электроника";
  if (hasAnyWord(titleLower, clothingWords)) return "Одежда";
  if (hasAnyWord(titleLower, furnitureWords)) return "Мебель";
  if (hasAnyWord(titleLower, jobWords) || jobPhrases.some(p => titleLower.includes(p))) return "Работа";
  if (hasAnyWord(titleLower, servicesKeywords)) return "Услуги";

  // 5. Приоритеты классификации по всему тексту
  if (hasStrictHousing) return "Недвижимость";
  if (isJob) return "Работа";
  if (isServices) return "Услуги";
  if (isTransport) return "Транспорт";
  if (hasHousingSignal) return "Недвижимость";
  if (hasFurnitureSignal) return "Мебель";
  if (hasElecBrandOrGeneric) return "Электроника";
  if (hasClothingSignal) return "Одежда";

  // 6. Сохраняем исходную категорию, если она имеет смысл
  const validCategories = [
    "Недвижимость", "Транспорт", "Электроника", "Услуги", 
    "Работа", "Мебель", "Одежда", "Новости", "🔍 Спрос", "Разное"
  ];
  if (currentCategory && validCategories.includes(currentCategory)) {
    return currentCategory;
  }

  return "Разное";
}
