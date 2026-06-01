// src/lib/categoryClassifier.ts

export function getCategoryNuclear(title: string, description: string, currentCategory?: string): string {
  const text = (title + " " + description).toLowerCase();

  // 1. Новости
  if (text.includes("новости") || text.includes("прогноз погоды") || text.includes("курс лиры")) return "Новости";

  // 2. Недвижимость
  const strictHousingKeywords = [
    "квартира", "дом", "вилла", "участок", "земля", "офис", "магазин", "пентхаус", "таунхаус", "студия", "апартаменты", "спальня",
    "1+1", "2+1", "3+1", "4+1", "0+1", "apartment", "villa", "studio", "flat", "office", "bedroom", "loft", "резорт", "resort",
    "аренда квартиры", "аренда дома", "аренда виллы", "long lease", "short lease", "аренда студии", "снять квартиру"
  ];
  const hasStrictHousing = strictHousingKeywords.some(kw => text.includes(kw)) || /\b\d\+\d\b/.test(text);

  const housingCoarseKeywords = ["сдам", "сдаю", "сниму", "аренда", "rent"];
  const hasCoarseHousing = housingCoarseKeywords.some(kw => text.includes(kw));
  const hasHousingSignal = hasStrictHousing || (hasCoarseHousing && !text.includes("авто") && !text.includes("машин") && !text.includes("car"));

  // 3. Работа (вакансии/найм, исключая услуги)
  const jobKeywords = ["вакансия", "требуется", "работа", "ищу работу", "ищем сотрудника", "набираем команду", "ищу сотрудника", "в автосервис требуется", "в ресторан требуется", "требуются сотрудники", "вакансии"];
  const hasJobKeywords = jobKeywords.some(kw => text.includes(kw));

  // 4. Услуги
  const servicesKeywords = [
    "услуги", "ремонт", "перевозка", "доставка", "массаж", "обучение", "клининг", "уборка", 
    "нотариус", "адвокат", "репетитор", "чистка", "стирка", "маникюр", "педикюр", "косметолог",
    "парикмахер", "визажист", "электрик", "сантехник", "грузчик", "переезды"
  ];
  const hasServicesKeywords = servicesKeywords.some(kw => text.includes(kw));

  const isServices = hasServicesKeywords;
  const isJob = hasJobKeywords && !hasServicesKeywords;

  // 5. Транспорт (Исключаем слова о парковке в контексте недвижимости)
  const vehicleBrands = ["bmw", "audi", "mercedes", "toyota", "nissan", "honda", "mazda", "ford", "vw", "kia", "hyundai", "tesla", "porsche", "мерседес", "lexus", "jeep", "range rover", "land rover", "yamaha", "suzuki", "ducati", "kawasaki"];
  const hasTransportBrand = vehicleBrands.some(brand => new RegExp(`\\b${brand}\\b`).test(text));
  const hasTransportGeneric = /\bавто(?:мобиль|бус|салон)?\b|\bавто\b|\bмашина\b|\bмотоцикл\b|\bскутер\b|\bквадроцикл\b/.test(text);
  const carRentSignals = ["аренда авто", "прокат авто", "сниму авто", "аренда машин", "прокат машин", "rent a car", "car rent"];
  const hasCarRentSignal = carRentSignals.some(s => text.includes(s));
  
  const isTransportSignal = hasTransportBrand || hasTransportGeneric || hasCarRentSignal;
  const isParkingOrGarageOnly = (text.includes("парковк") || 
                                 text.includes("паркинг") || 
                                 text.includes("гараж") || 
                                 text.includes("стоянка") ||
                                 /место для (?:авто|машины|машин)/.test(text) ||
                                 /парковочное место/.test(text)) && 
                                !hasTransportBrand && 
                                !hasCarRentSignal;

  const isTransport = isTransportSignal && !isParkingOrGarageOnly;

  // 6. Мебель
  const furnitureKeywords = ["диван", "шкаф", "стол", "стул", "кровать", "матрас", "кухня", "комод", "тумба", "кресло", "стеллаж"];
  const isFurniture = furnitureKeywords.some(kw => text.includes(kw));

  // 7. Электроника
  const elecKeywords = ["iphone", "ipad", "ноутбук", "macbook", "телевизор", "смартфон", "пылесос", "playstation", "xbox", "телефон", "наушники", "apple watch"];
  const isElectronics = elecKeywords.some(kw => text.includes(kw)) || /\b(?:пк|pc|тв|tv)\b/.test(text);

  // 8. Одежда
  const clothingKeywords = ["платье", "обувь", "одежда", "куртка", "штаны", "кроссовки", "сумка", "футболка", "джинсы", "юбка", "костюм"];
  const isClothing = clothingKeywords.some(kw => text.includes(kw));

  // Приоритеты классификации
  if (hasStrictHousing) return "Недвижимость";
  if (isJob) return "Работа";
  if (isServices) return "Услуги";
  if (isTransport) return "Транспорт";
  if (hasHousingSignal) return "Недвижимость";
  if (isFurniture) return "Мебель";
  if (isElectronics) return "Электроника";
  if (isClothing) return "Одежда";

  if (currentCategory && currentCategory !== "Разное" && currentCategory !== "") {
    return currentCategory;
  }

  return "Разное";
}
