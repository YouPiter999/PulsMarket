import { CountryCode } from "../lib/config";

export type Currency = "GBP" | "EUR" | "USD" | "TRY";

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  category: string;
  subCategory?: string;
  images: string[];
  location: {
    countryCode: CountryCode;
    region: string;
    city: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  seller: {
    id: string;
    name: string;
    phone?: string;
    telegram?: string;
    avatar?: string;
  };
  createdAt: number;
  updatedAt: number;
  status: "active" | "sold" | "hidden" | "moderation";
  source: "user" | "telegram_scraper";
  externalLink?: string; // Ссылка на оригинальный пост в ТГ
  isPriority?: boolean;
  isOfficial?: boolean;
  viewCount: number;
  metadata: Record<string, any>; // Для доп. полей типа "пробег" или "кол-во комнат"
}
