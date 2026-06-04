import { Metadata } from 'next';
import { getFirestoreDb } from '@/lib/firebaseAdmin';
import ListingDetailClient, { Listing } from './ListingDetailClient';

// ISR: Revalidate this page on demand or every 60 seconds
export const revalidate = 60; 

export const STATIC_VIP_LISTINGS: Record<string, Listing> = {
  'tg_150385_super_vip': {
    id: 'tg_150385_super_vip',
    title: 'Подготовка к школе и логопедия в Искеле',
    price: '0',
    currency: 'EUR',
    category: 'Услуги',
    location: 'Искеле',
    createdAt: '2026-06-03T17:00:00.000Z',
    username: '@KseniaBorodina',
    description: '🎓 Подарите вашему ребенку уверенный старт!\nПриглашаю малышей и дошкольников на комплексные индивидуальные занятия. Помогу освоить базовые навыки, полюбить учебу и научиться говорить правильно и красиво!\n\n📚 Обучение и подготовка:\n• Чтение: от изучения букв до беглого и осознанного чтения.\n• Письмо: правильная постановка руки и уверенные первые строчки.\n• Математика: увлекательное знакомство с цифрами, логикой и счетом.\n\n🗣 Логопедия и развитие речи:\n• Помогу вашему ребенку заговорить (бережный запуск речи).\n• Профессиональная постановка звуков и коррекция дикции.\n\n📍 Локация: Индивидуальные занятия в Искеле.\n\n👉 Запишитесь на первое занятие прямо сейчас и подарите своему ребенку уверенность в собственных силах!\n📩 Для записи и вопросов пишите @KseniaBorodina',
    image_url: 'https://i.ibb.co/PztD3VYF/0742848d8de6.jpg',
    source: 'Telegram (@northcyprus_island)',
    country: 'Северный Кипр',
    is_priority: true,
    metadata: { rooms: '' }
  },
  'FPY37jBN5znxPfuN1FNt': {
    id: 'FPY37jBN5znxPfuN1FNt',
    title: 'Роскошная квартира в аренду',
    price: '140',
    currency: 'EUR',
    category: 'Недвижимость',
    location: 'Искеле',
    createdAt: '2026-05-21T14:34:52.974Z',
    username: '@Blesk_vbg',
    description: 'Роскошная квартира в аренду на курорте Grand Sapphire Resort в центре Iskele в Северном Кипре.\nВ квартире 1+2 две элегантные спальни, две ванные комнаты, просторная гостиная с кухней и просторная терраса на 5 этаже с впечатляющим видом на море.\n140 € за ночь+уборка Писать @Blesk_vbg',
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    source: 'Telegram (@northcyprus_island)',
    country: 'Северный Кипр',
    is_priority: true,
    metadata: { rooms: '1+2' }
  }
};

async function getListingData(id: string): Promise<Listing | null> {
  if (STATIC_VIP_LISTINGS[id]) {
    return STATIC_VIP_LISTINGS[id];
  }
  try {
    const db = getFirestoreDb();
    const docRef = db.collection('listings').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    if (!data) return null;

    return { 
      id: doc.id, 
      ...data 
    } as Listing;
  } catch (error) {
    console.error('Error fetching listing in server component:', error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const listing = await getListingData(id);

  if (!listing) {
    return {
      title: 'Объявление не найдено | PulseMarket',
      description: 'Это объявление больше не доступно или было удалено.',
      robots: { index: false, follow: true },
    };
  }

  const title = `${listing.title} — ${Number(listing.price).toLocaleString()} ${listing.currency} | PulseMarket`;
  
  // Create a clean, readable meta description without HTML/Telegram tags
  const cleanDesc = (listing.description || '')
    .replace(/@[a-zA-Z0-9_]+/g, '')
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const description = cleanDesc
    ? (cleanDesc.length > 155 ? cleanDesc.substring(0, 155) + '...' : cleanDesc)
    : `Купить ${listing.title} в городе ${listing.location || 'Северный Кипр'}. Цена: ${Number(listing.price).toLocaleString()} ${listing.currency}. Все подробности на сайте!`;
  
  const imageUrl = (!listing.image_url || listing.image_url === 'None' || listing.image_url === 'null' || listing.image_url === 'undefined' || listing.image_url === '[]') ? 'https://pulsemarket-group-app.web.app/promo_banner.png' : listing.image_url;

  return {
    title,
    description,
    alternates: {
      canonical: `https://pulsemarket-group-app.web.app/listing/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://pulsemarket-group-app.web.app/listing/${id}`,
      siteName: 'PulseMarket',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ListingPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const listing = await getListingData(id);
  
  if (!listing) {
    return <ListingDetailClient initialListing={null} />;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    image: (!listing.image_url || listing.image_url === 'None' || listing.image_url === 'null' || listing.image_url === 'undefined' || listing.image_url === '[]') ? 'https://pulsemarket-group-app.web.app/promo_banner.png' : listing.image_url,
    description: listing.description || listing.title,
    offers: {
      '@type': 'Offer',
      url: `https://pulsemarket-group-app.web.app/listing/${id}`,
      priceCurrency: listing.currency === '₽' ? 'RUB' : listing.currency === '€' ? 'EUR' : listing.currency === '$' ? 'USD' : listing.currency === '£' ? 'GBP' : 'TRY',
      price: listing.price || '0',
      itemCondition: 'https://schema.org/UsedCondition',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: listing.source || 'PulseMarket User'
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ListingDetailClient initialListing={listing} />
    </>
  );
}
