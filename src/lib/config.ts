export const COUNTRIES = {
  CY: {
    name: "North Cyprus",
    defaultCurrency: "GBP",
    regions: ["Kyrenia", "Famagusta", "Nicosia", "Iskele", "Lefke", "Guzelyurt"],
    languages: ["ru", "en", "tr"]
  },
  ES: {
    name: "Spain",
    defaultCurrency: "EUR",
    regions: ["Madrid", "Barcelona", "Valencia", "Alicante", "Malaga"],
    languages: ["es", "en", "ru"]
  },
  // Легко добавляем любую другую страну
} as const;

export type CountryCode = keyof typeof COUNTRIES;

export const DEFAULT_COUNTRY: CountryCode = "CY";
