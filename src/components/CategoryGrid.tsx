import React from 'react';
import { 
  Building2, 
  Car, 
  Laptop, 
  Wrench, 
  Briefcase, 
  Sofa, 
  Shirt, 
  Package, 
  Megaphone, 
  Compass,
  Search
} from 'lucide-react';

export const getCategoryIcon = (id: string, className: string = "w-6 h-6") => {
  switch (id) {
    case 'Все': return <Compass className={className} />;
    case 'Недвижимость': return <Building2 className={className} />;
    case 'Транспорт': return <Car className={className} />;
    case 'Электроника': return <Laptop className={className} />;
    case 'Услуги': return <Wrench className={className} />;
    case 'Работа': return <Briefcase className={className} />;
    case '🔍 Спрос': return <Search className={className} />;
    case 'Мебель': return <Sofa className={className} />;
    case 'Одежда': return <Shirt className={className} />;
    case 'Новости': return <Megaphone className={className} />;
    default: return <Package className={className} />;
  }
};

export const categories = [
  { id: 'Все', name: { ru: 'Все', tr: 'Hepsi', en: 'All' } },
  { id: 'Недвижимость', name: { ru: 'Недвижимость', tr: 'Emlak', en: 'Real Estate' } },
  { id: 'Транспорт', name: { ru: 'Транспорт', tr: 'Vasıta', en: 'Transport' } },
  { id: 'Электроника', name: { ru: 'Электроника', tr: 'Elektronik', en: 'Electronics' } },
  { id: 'Услуги', name: { ru: 'Услуги', tr: 'Hizmetler', en: 'Services' } },
  { id: 'Работа', name: { ru: 'Работа', tr: 'İş', en: 'Jobs' } },
  { id: '🔍 Спрос', name: { ru: 'Спрос', tr: 'Aranıyor', en: 'Demand' } },
  { id: 'Мебель', name: { ru: 'Мебель', tr: 'Mobilya', en: 'Furniture' } },
  { id: 'Одежда', name: { ru: 'Одежда', tr: 'Giyim', en: 'Clothing' } },
  { id: 'Разное', name: { ru: 'Разное', tr: 'Diğer', en: 'Misc' } },
  { id: 'Новости', name: { ru: 'Новости', tr: 'Haberler', en: 'News' } },
];

export const KNOWN_CATEGORIES = ['Недвижимость', 'Транспорт', 'Электроника', 'Услуги', 'Работа', 'Мебель', 'Одежда', 'Новости', '🔍 Спрос'];

export function resolveCategory(categoryName: string = ''): string {
  if (!categoryName) return 'Разное';
  if (KNOWN_CATEGORIES.includes(categoryName)) return categoryName;
  return 'Разное';
}


interface CategoryGridProps {
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (val: string) => void;
  listings: any[];
  selectedCountry: string;
  lang: 'ru' | 'en' | 'tr';
  getListingSubcategory: (title: string, desc: string, cat: string, price: number) => string;
  categoryCounts?: Record<string, number>;
}

export function CategoryGrid({
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  listings,
  selectedCountry,
  lang,
  getListingSubcategory,
  categoryCounts
}: CategoryGridProps) {
  return (
    <div className="bg-white py-6 shadow-sm" id="categories-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 lg:grid-cols-10 gap-2 sm:gap-4 justify-items-center">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = categoryCounts && categoryCounts[cat.id] !== undefined
              ? categoryCounts[cat.id]
              : listings.filter(l => {
                  const sameCountry = (l.country || 'Северный Кипр').toLowerCase() === selectedCountry.toLowerCase();
                  return sameCountry && (cat.id === 'Все' ? true : resolveCategory(l.category) === cat.id);
                }).length;

            return (
              <button 
                key={cat.id} 
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubcategory('Все');
                }}
                className="flex flex-col items-center gap-2 group w-full transition-all relative"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-slate-500 shadow-sm transition-all duration-300 ${isActive ? 'bg-blue-600 text-white scale-110 shadow-blue-200 shadow-lg' : 'bg-[#f2f4f7] group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:scale-105'}`}>
                  {getCategoryIcon(cat.id, "w-6 h-6")}
                </div>
                <div className="flex flex-col items-center">
                  <span className={`text-xs font-bold text-center line-clamp-1 ${isActive ? 'text-blue-600' : 'text-gray-700'}`}>{cat.name[lang]}</span>
                  <span className="text-[10px] font-medium text-gray-550">{count}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Subcategories for Real Estate & Transport */}
        {(selectedCategory === 'Недвижимость' || selectedCategory === 'Транспорт') && (
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-3 justify-center">
            {['Все', 'Сдаю', 'Сниму', 'Куплю', 'Продам'].map((sub) => {
              const isSubActive = selectedSubcategory === sub;
              const subCount = listings.filter(l => {
                const sameCountry = (l.country || 'Северный Кипр').toLowerCase() === selectedCountry.toLowerCase();
                if (!sameCountry || l.category !== selectedCategory) return false;
                if (sub === 'Все') return true;
                return getListingSubcategory(l.title, l.description, l.category, Number(l.price || 0)) === sub;
              }).length;

              const iconMap: Record<string, string> = {
                'Все': '✨',
                'Сдаю': '🔑',
                'Сниму': '🙋',
                'Куплю': '💰',
                'Продам': '🏷️'
              };

              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 shadow-sm ${
                    isSubActive 
                    ? 'bg-blue-600 text-white shadow-blue-200 shadow-md scale-105' 
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 hover:-translate-y-0.5'
                  }`}
                >
                  <span className="text-base">{iconMap[sub]}</span>
                  <span>{sub}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${isSubActive ? 'bg-blue-500/30' : 'bg-gray-100'}`}>
                    {subCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
