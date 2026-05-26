import { Listing } from "../types/listing";

export const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    title: "Вилла с видом на море в Кирении",
    description: "Роскошная вилла 3+1 с собственным бассейном и садом. Полностью меблирована.",
    price: 350000,
    currency: "GBP",
    category: "Недвижимость",
    images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800"],
    location: {
      countryCode: "CY",
      region: "Kyrenia",
      city: "Catalkoy",
    },
    seller: { id: "u1", name: "Александр" },
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now(),
    status: "active",
    source: "telegram_scraper",
    externalLink: "https://t.me/c/123/456",
    viewCount: 120,
    metadata: {}
  },
  {
    id: "2",
    title: "Apartment in Valencia City Center",
    description: "Beautiful 2-bedroom apartment near the park. Modern renovation.",
    price: 1200,
    currency: "EUR",
    category: "Rent",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800"],
    location: {
      countryCode: "ES",
      region: "Valencia",
      city: "Valencia",
    },
    seller: { id: "u2", name: "Maria" },
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now(),
    status: "active",
    source: "user",
    viewCount: 450,
    metadata: {}
  },
  {
    id: "3",
    title: "Range Rover Sport 2022",
    description: "Ideal condition, low mileage. Full service history.",
    price: 85000,
    currency: "GBP",
    category: "Авто",
    images: ["https://images.unsplash.com/photo-1606611013016-969c19ba27bb?auto=format&fit=crop&q=80&w=800"],
    location: {
      countryCode: "CY",
      region: "Nicosia",
      city: "Nicosia",
    },
    seller: { id: "u3", name: "Dmitry" },
    createdAt: Date.now() - 3600000 * 5,
    updatedAt: Date.now(),
    status: "active",
    source: "telegram_scraper",
    viewCount: 890,
    metadata: {}
  },
  {
    id: "4",
    title: "iPhone 15 Pro Max 256GB",
    description: "New, sealed. Worldwide warranty.",
    price: 1100,
    currency: "EUR",
    category: "Электроника",
    images: ["https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=800"],
    location: {
      countryCode: "ES",
      region: "Barcelona",
      city: "Barcelona",
    },
    seller: { id: "u4", name: "TechStore" },
    createdAt: Date.now() - 3600000 * 1,
    updatedAt: Date.now(),
    status: "active",
    source: "user",
    viewCount: 2300,
    metadata: {}
  }
];
