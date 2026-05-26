import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Rich set of premium mock listings for high-quality local development preview
const MOCK_LISTINGS = [
  {
    id: "mock_news_1",
    title: "Метеорологи предупреждают о рекордной жаре на Северном Кипре на этой неделе ☀️",
    price: "0",
    currency: "£",
    category: "Новости",
    location: "Гирне, Северный Кипр",
    createdAt: new Date().toISOString(),
    username: "@CyprusWeather",
    description: "Летний сезон вступает в полную силу. Жителям и туристам рекомендуется избегать нахождения под прямыми солнечными лучами с 11:00 до 16:00, пить больше воды и использовать солнцезащитные средства с SPF 50+. Температура воздуха в центральных районах может подняться до +42°C.",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    source: "Telegram (@NorthCyprus_Island)",
    country: "Северный Кипр",
    is_priority: true
  },
  {
    id: "mock_re_1",
    title: "Сдам люкс апартаменты 2+1 в Гирне с панорамным видом на море 🌊",
    price: "850",
    currency: "£",
    category: "Недвижимость",
    location: "Кирения (Гирне), Центр",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    username: "@GirneLuxuryHomes",
    description: "Сдаются шикарные апартаменты в элитном жилом комплексе с бассейном и охраной. 2 спальни, просторная гостиная с выходом на террасу, современная кухня со всей встроенной техникой. Полностью меблирована, кондиционеры во всех комнатах. До моря всего 5 минут пешком!",
    image_url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
    source: "Telegram (@NorthCyprus_Island)",
    country: "Северный Кипр",
    is_priority: true,
    metadata: {
      rooms: "2+1",
      area: 95
    }
  },
  {
    id: "mock_car_1",
    title: "Продам BMW 520i M-Sport 2020 года в идеальном состоянии 🔥",
    price: "32500",
    currency: "€",
    category: "Транспорт",
    location: "Лефкоша, Центр",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    username: "@BMW_Cyprus_Seller",
    description: "Продается отличный автомобиль BMW 5 серии в заводском М-пакете. Родной пробег 42,000 км, один владелец на острове, бережное гаражное хранение. Автомобиль полностью обслужен у официального дилера, заменены все расходники. Салон кожа Nappa, панорамная крыша, премиум акустика Harman/Kardon.",
    image_url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
    source: "Telegram (@SergeyAuto)",
    country: "Северный Кипр",
    is_priority: true,
    metadata: {
      year: 2020,
      mileage: 42000
    }
  },
  {
    id: "mock_re_2",
    title: "Аренда уютной студии в Искеле рядом с песчаным пляжем Long Beach 🏖️",
    price: "480",
    currency: "£",
    category: "Недвижимость",
    location: "Искеле, Лонг Бич",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    username: "@IskeleRealEstate",
    description: "Отличный вариант для комфортного проживания на побережье. Студия в новом комплексе Caesar Resort с богатой инфраструктурой: бассейны, аквапарк, фитнес-центр, спа, рестораны и детские площадки. Квартира укомплектована всей необходимой мебелью и бытовой техникой.",
    image_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    source: "Telegram (@CyprusRentals)",
    country: "Северный Кипр",
    is_priority: false,
    metadata: {
      rooms: "0+1",
      area: 45
    }
  },
  {
    id: "mock_elec_1",
    title: "Продам iPhone 14 Pro Max 256GB Space Black в отличном состоянии 📱",
    price: "950",
    currency: "$",
    category: "Электроника",
    location: "Лимасол, Кипр",
    createdAt: new Date(Date.now() - 28800000).toISOString(),
    username: "@LimassolGadgets",
    description: "Продаю свой личный телефон в связи с переходом на новую модель. Идеальное внешнее и техническое состояние, без сколов и царапин. С первого дня носился в защитном стекле и чехле. Состояние аккумулятора 92%. Полный комплект: коробка, оригинальный кабель.",
    image_url: "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?auto=format&fit=crop&w=800&q=80",
    source: "Telegram (@LimassolAds)",
    country: "Испания",
    is_priority: false
  },
  {
    id: "mock_news_2",
    title: "Цены на недвижимость на Кипре выросли на 12% за последний год 📊",
    price: "0",
    currency: "£",
    category: "Новости",
    location: "Лимасол, Кипр",
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    username: "@CyprusFinance",
    description: "Аналитическое агентство опубликовало новый отчет по рынку недвижимости Кипра. Наибольший рост стоимости квадратного метра зафиксирован в Лимасоле и Пафосе, что обусловлено высоким спросом со стороны иностранных инвесторов и релокантов IT-сектора. Эксперты прогнозируют сохранение тенденции.",
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    source: "Telegram (@NorthCyprus_Island)",
    country: "Испания",
    is_priority: true
  },
  {
    id: "mock_job_1",
    title: "Ищем опытного бариста в стильную новую кофейню в Лефкоше ☕",
    price: "1200",
    currency: "€",
    category: "Работа",
    location: "Никосия (Лефкоша)",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    username: "@LefkosaCoffeeCo",
    description: "В нашу дружную команду требуется бариста с опытом работы от 1 года. Обязанности: приготовление классических кофейных напитков и альтернативы, поддержание чистоты за стойкой, общение с гостями. График 5/2, официальное трудоустройство, стабильная оплата + чаевые.",
    image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    source: "Telegram (@LefkosaJobs)",
    country: "Северный Кипр",
    is_priority: false
  },
  {
    id: "mock_goods_1",
    title: "Продам роскошный угловой кожаный диван Chesterfield 🛋️",
    price: "1100",
    currency: "£",
    category: "Вещи",
    location: "Гирне, Беллапаис",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    username: "@BellapaisFurniture",
    description: "Шикарный итальянский угловой диван Chesterfield из натуральной высококачественной кожи коричневого цвета. Идеально впишется в современную гостиную или рабочий кабинет. Очень мягкий и комфортный, состояние нового, без потертостей и повреждений.",
    image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
    source: "Telegram (@GirneDeals)",
    country: "Северный Кипр",
    is_priority: false
  }
];

import fs from 'fs';
import path from 'path';

try {
  const dataPath = path.join(process.cwd(), 'src/lib/real-data.json');
  if (fs.existsSync(dataPath)) {
    const realData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (realData && realData.length > 0) {
      MOCK_LISTINGS.length = 0;
      MOCK_LISTINGS.push(...realData);
      console.log(`Loaded ${realData.length} REAL listings for local preview!`);
    }
  }
} catch (e) {
  console.error("Error loading real data", e);
}

const getMockDb = () => {
  const mockDocs = MOCK_LISTINGS.map(item => ({
    id: item.id,
    data: () => item,
    ref: {
      delete: async () => {
        console.log(`Mock DB: delete called on listing ${item.id}`);
      }
    }
  }));

  return {
    collection: () => ({
      doc: (id?: string) => ({
        get: async () => {
          const found = MOCK_LISTINGS.find(item => item.id === id);
          return {
            exists: !!found,
            id: id || "mock_id",
            data: () => found || {}
          };
        },
        set: async (data: any) => {
          console.log("Mock DB: set called with", data);
        },
        update: async (data: any) => {
          console.log("Mock DB: update called with", data);
        },
        delete: async () => {
          console.log(`Mock DB: delete called on doc`);
        }
      }),
      orderBy: () => ({
        limit: (n: number) => ({
          get: async () => ({
            docs: mockDocs.slice(0, n)
          })
        }),
        get: async () => ({
          docs: mockDocs
        })
      }),
      limit: (n: number) => ({
        get: async () => ({
          docs: mockDocs.slice(0, n)
        })
      }),
      get: async () => ({
        docs: mockDocs
      })
    }),
    batch: () => ({
      delete: () => {},
      commit: async () => {
        console.log("Mock DB: bulk batch delete committed!");
      }
    })
  } as any;
};

export const getFirestoreDb = () => {
  // If we are in local development and have no project credentials,
  // immediately use the highly functional mock DB to avoid runtime query failures.
  const hasCredentials = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!hasCredentials && process.env.NODE_ENV === 'development') {
    console.log('Local development detected without Firebase credentials. Using Mock DB fallback directly.');
    return getMockDb();
  }

  try {
    const apps = getApps();
    if (!apps.length) {
      // In cloud environments, it auto-initializes. 
      initializeApp();
      console.log('Firebase Admin modular initialized.');
    }
    // Attempt to connect and fetch database instance
    return getFirestore();
  } catch (error) {
    console.warn('Firebase initialization or connection failed. Using highly functional local Mock Database fallback:', error);
    return getMockDb();
  }
};
