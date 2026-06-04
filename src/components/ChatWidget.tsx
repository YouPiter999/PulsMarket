'use client';

import { useState, useEffect } from 'react';

const tooltips = {
  ru: 'Жалобы и поддержка 🤖',
  en: 'Support & Complaints 🤖',
  tr: 'Destek ve Şikayetler 🤖'
};

export default function ChatWidget() {
  const [lang, setLang] = useState<'ru' | 'en' | 'tr'>('ru');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const detectLang = () => {
      try {
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'tr') setLang('tr');
        else if (browserLang === 'en') setLang('en');
        else setLang('ru');
      } catch (e) {}
    };
    detectLang();

    // Listen to lang changes or HTML lang attribute updates
    const interval = setInterval(() => {
      const htmlLang = document.documentElement.lang;
      if (htmlLang === 'tr' || htmlLang === 'en' || htmlLang === 'ru') {
        setLang(htmlLang as any);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const tooltipText = tooltips[lang];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex items-center justify-end">
      {/* Tooltip on the left */}
      <div 
        className={`mr-3 bg-slate-900/95 text-white text-xs font-black py-2.5 px-4 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md transition-all duration-300 transform whitespace-nowrap pointer-events-none ${
          showTooltip 
            ? 'opacity-100 translate-x-0 scale-100' 
            : 'opacity-0 translate-x-4 scale-95'
        }`}
      >
        {tooltipText}
      </div>

      {/* Floating Support Button linked to Telegram */}
      <a
        href="https://t.me/BotHelpG_bot?start=support"
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-lg shadow-blue-500/40 transition-all duration-300 hover:scale-110 active:scale-95 group"
        aria-label={tooltipText}
      >
        {/* Pulsing ambient border glow */}
        <span className="absolute -inset-1 rounded-full bg-blue-500/30 animate-pulse pointer-events-none blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></span>
        <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping pointer-events-none opacity-40"></span>
        
        {/* Container for Telegram logo and Support badge */}
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Telegram Logo SVG */}
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.89 1.2-5.33 3.52-.5.35-.96.52-1.37.51-.45-.01-1.32-.26-1.97-.47-.8-.26-1.43-.4-1.37-.85.03-.23.35-.47.96-.72 3.76-1.63 6.27-2.71 7.54-3.23 3.58-1.48 4.32-1.74 4.81-1.75.11 0 .35.03.5.16.13.1.17.24.19.34.02.07.03.22.02.34z"/>
          </svg>
          
          {/* Badge overlay representing complaints / support */}
          <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full p-1 border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center w-6 h-6 transition-all duration-300 group-hover:scale-110">
            <span className="text-[10px] leading-none animate-pulse">🚨</span>
          </div>
        </div>
      </a>
    </div>
  );
}
