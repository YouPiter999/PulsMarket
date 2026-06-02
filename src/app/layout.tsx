import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  /* ── Base URL for all relative OG/canonical paths ── */
  metadataBase: new URL('https://pulsemarket-group-app.web.app'),

  /* ── Title ── */
  title: {
    default: 'PulseMarket — #1 маркетплейс Северного Кипра',
    template: '%s | PulseMarket',
  },

  /* ── Description ── */
  description:
    'PulseMarket — крупнейший маркетплейс Северного Кипра. Недвижимость, авто, электроника, услуги и работа. Мгновенные уведомления через Telegram-бот. Покупайте и продавайте быстро и безопасно!',

  /* ── Keywords ── */
  keywords: [
    'PulseMarket', 'маркетплейс', 'Северный Кипр', 'KKTC', 'ТРСК',
    'купить', 'продать', 'недвижимость', 'авто', 'аренда',
    'объявления', 'Кипр', 'Telegram', 'marketplace', 'North Cyprus',
  ],

  /* ── Canonical & Alternates ── */
  alternates: {
    canonical: '/',
    languages: {
      'ru-RU': '/',
      'tr-TR': '/',
      'en-US': '/',
    },
  },

  /* ── Robots ── */
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  /* ── Open Graph (defaults) ── */
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: '/',
    siteName: 'PulseMarket',
    title: 'PulseMarket — #1 маркетплейс Северного Кипра',
    description:
      'Недвижимость, авто, электроника, услуги — всё на одной платформе с AI-поиском и Telegram-ботом. Тысячи актуальных объявлений Северного Кипра.',
    images: [
      {
        url: '/promo_banner.png',
        width: 1200,
        height: 630,
        alt: 'PulseMarket — маркетплейс Северного Кипра',
        type: 'image/png',
      },
    ],
  },

  /* ── Twitter Card ── */
  twitter: {
    card: 'summary_large_image',
    title: 'PulseMarket — #1 маркетплейс Северного Кипра',
    description:
      'Покупайте и продавайте на Северном Кипре. AI-поиск, Telegram-уведомления, тысячи объявлений.',
    images: ['/promo_banner.png'],
    creator: '@PulseMarket',
  },

  /* ── Icons ── */
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },

  /* ── Theme color ── */
  other: {
    'theme-color': '#2563eb',
    'msapplication-TileColor': '#2563eb',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
  },

  /* ── Verification ── */
  verification: {
    google: '3aVMbqDl-qGapGNrB_HzjnA5uzmRZDstJoilaenNovc',
  },

  /* ── Category ── */
  category: 'marketplace',

  /* ── App Links ── */
  applicationName: 'PulseMarket',
  creator: 'PulseMarket Team',
  publisher: 'PulseMarket',
  manifest: '/manifest.json',
};

import Script from "next/script";
import ChatWidget from "@/components/ChatWidget";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className="h-full antialiased"
    >
      <head>
        {/* Removed notranslate to allow Google Translate to work */}
      </head>
      <body className="min-h-full flex flex-col select-none">
        <Script id="anti-scraping" strategy="beforeInteractive">
          {`
            if (typeof window !== 'undefined') {
              document.addEventListener('contextmenu', e => e.preventDefault());
              document.addEventListener('dragstart', e => {
                if (e.target.nodeName === 'IMG') e.preventDefault();
              });
            }
          `}
        </Script>
        {children}
        
        {/* Google Translate Widget Container */}
        <div id="google_translate_element" className="fixed bottom-4 left-4 z-[9999] opacity-70 hover:opacity-100 transition-opacity"></div>
        
        <Script id="google-translate-init" strategy="lazyOnload">
          {`
            function googleTranslateElementInit() {
              new window.google.translate.TranslateElement(
                {
                  pageLanguage: 'ru',
                  layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
                },
                'google_translate_element'
              );
            }
          `}
        </Script>
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="lazyOnload"
        />
        
        {/* Web AI Assistant Widget */}
        <ChatWidget />
      </body>
    </html>
  );
}
