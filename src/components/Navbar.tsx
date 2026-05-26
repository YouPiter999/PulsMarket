import React from 'react';
import Link from 'next/link';
import { translateListingText } from '../utils/translations'; // I'll need to extract this

interface NavbarProps {
  selectedCountry: string;
  setSelectedCountry: (val: string) => void;
  countries: any[];
  t: any;
  lang: 'ru' | 'en' | 'tr';
  setLang: (val: 'ru' | 'en' | 'tr') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isAuthChecking: boolean;
  currentUser: any;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (val: boolean) => void;
  favoritesCount: number;
}

export function Navbar({
  selectedCountry,
  setSelectedCountry,
  countries,
  t,
  lang,
  setLang,
  theme,
  toggleTheme,
  isAuthChecking,
  currentUser,
  searchQuery,
  setSearchQuery,
  showFavoritesOnly,
  setShowFavoritesOnly,
  favoritesCount
}: NavbarProps) {
  return (
    <header>
      {/* Upper Navbar (Location/Language) */}
      <div className="bg-white border-b text-xs text-gray-500 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
              <span>📍</span>
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                aria-label="Select Country"
                className="bg-transparent border-none p-0 focus:ring-0 text-xs font-medium cursor-pointer"
              >
                {countries.map(c => (
                  <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
            <span className="hover:text-blue-600 cursor-pointer">{t.business}</span>
            <span className="hover:text-blue-600 cursor-pointer">{t.help}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4 border-r border-gray-200/20 pr-4">
               <button onClick={toggleTheme} className="text-xl mr-2 hover:scale-110 transition-transform" title="Переключить тему">
                 {theme === 'dark' ? '☀️' : '🌙'}
               </button>
               <button onClick={() => setLang('ru')} className={`hover:text-blue-600 ${lang === 'ru' ? 'text-blue-600 font-bold' : ''}`}>RU</button>
               <button onClick={() => setLang('tr')} className={`hover:text-blue-600 ${lang === 'tr' ? 'text-blue-600 font-bold' : ''}`}>TR</button>
               <button onClick={() => setLang('en')} className={`hover:text-blue-600 ${lang === 'en' ? 'text-blue-600 font-bold' : ''}`}>EN</button>
            </div>
            <span className="hover:text-blue-600 cursor-pointer">{t.orders}</span>
             {isAuthChecking ? (
               <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             ) : currentUser ? (
               <Link href="/profile" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer group">
                 {currentUser.photo_url ? (
                   <img src={currentUser.photo_url} alt="Me" className="w-5 h-5 rounded-full border border-gray-200" />
                 ) : (
                   <span className="text-base">👤</span>
                 )}
                 <span className="font-bold text-gray-900 group-hover:text-blue-600">{currentUser.first_name || 'Профиль'}</span>
               </Link>
             ) : (
               <Link href="/login" className="hover:text-blue-600 cursor-pointer font-semibold text-gray-900">{t.login}</Link>
             )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="glass-nav sticky top-0 z-50 py-3 md:py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop/Tablet Layout (>= lg) */}
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">PulseMarket</span>
            </Link>
            
            <div className="flex-1 flex gap-2">
              <button 
                onClick={() => {
                  const element = document.getElementById('categories-grid');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shrink-0"
              >
                <span>☰</span>
                {t.categories}
              </button>
              
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-lg py-2.5 px-4 focus:outline-none focus:border-blue-400 text-gray-900 dark:text-white font-medium"
                />
                <button 
                  onClick={() => {
                    const element = document.getElementById('categories-grid');
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="absolute right-0 top-0 bottom-0 bg-blue-600 text-white px-6 rounded-r-lg font-bold hover:bg-blue-700 transition-all"
                >
                  {t.find}
                </button>
              </div>
            </div>

            <Link href="/blog" className="px-4 py-2 font-bold text-gray-700 hover:text-blue-600">Блог</Link>

            <button 
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold border transition-all shrink-0 hover:shadow-md hover:-translate-y-0.5 ${showFavoritesOnly ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <span className="text-base transition-transform duration-300 hover:scale-110">{showFavoritesOnly ? '❤️' : '🤍'}</span>
              <span>{lang === 'ru' ? 'Избранное' : lang === 'tr' ? 'Favoriler' : 'Favorites'}</span>
              {favoritesCount > 0 && (
                <span className={`text-[10px] font-black rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center ${showFavoritesOnly ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  {favoritesCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Mobile Layout (< lg) */}
          <div className="lg:hidden flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">PulseMarket</span>
              </Link>
              <button 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`p-2 rounded-xl transition-all ${showFavoritesOnly ? 'bg-red-50 text-red-600 shadow-sm' : 'bg-gray-100 text-gray-600'}`}
              >
                {showFavoritesOnly ? '❤️' : '🤍'}
                {favoritesCount > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {favoritesCount}
                  </span>
                )}
              </button>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const element = document.getElementById('categories-grid');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 w-11 h-11 rounded-xl font-bold flex items-center justify-center shrink-0 transition-colors"
                title="Все категории"
              >
                <span>☰</span>
              </button>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 pr-10 focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900 text-sm transition-all font-medium"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
