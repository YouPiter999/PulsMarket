import { Metadata } from 'next';
import { getFirestoreDb } from '@/lib/firebaseAdmin';
import ListingDetailClient, { Listing } from './ListingDetailClient';

// ISR: Revalidate this page on demand or every 60 seconds
export const revalidate = 60; 

async function getListingData(id: string): Promise<Listing | null> {
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
