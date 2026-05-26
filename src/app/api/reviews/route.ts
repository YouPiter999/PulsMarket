import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('seller_id');

    if (!sellerId) {
      return NextResponse.json({ error: 'Missing seller_id parameter' }, { status: 400 });
    }

    const db = getFirestoreDb();
    const snapshot = await db.collection('reviews')
      .where('seller_telegram_id', '==', String(sellerId))
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const reviews = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      reviews
    });
  } catch (error: any) {
    console.error('GET Reviews Error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getFirestoreDb();
    const data = await request.json();

    const {
      reviewer_id,
      reviewer_name,
      reviewer_photo,
      seller_telegram_id,
      seller_username,
      rating,
      text,
      listing_id
    } = data;

    // Validation
    if (!reviewer_id || !seller_telegram_id || !rating || !text) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: reviewer_id, seller_telegram_id, rating, and text are mandatory.'
      }, { status: 400 });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({
        success: false,
        message: 'Rating must be a number between 1 and 5.'
      }, { status: 400 });
    }

    // Self-review protection
    if (String(reviewer_id) === String(seller_telegram_id)) {
      return NextResponse.json({
        success: false,
        message: 'Вы не можете оставить отзыв самому себе.'
      }, { status: 400 });
    }

    // Create review document
    const reviewRef = db.collection('reviews').doc();
    const newReview = {
      id: reviewRef.id,
      reviewer_id: String(reviewer_id),
      reviewer_name: reviewer_name || 'Анонимный покупатель',
      reviewer_photo: reviewer_photo || null,
      seller_telegram_id: String(seller_telegram_id),
      seller_username: seller_username || null,
      rating: numRating,
      text: String(text).trim(),
      listing_id: listing_id || null,
      createdAt: new Date().toISOString()
    };

    // Atomic Update via Firestore Transaction for aggregated metrics
    const userRef = db.collection('users').doc(String(seller_telegram_id));
    
    await db.runTransaction(async (transaction: any) => {
      const userSnap = await transaction.get(userRef);
      
      let currentRatingAvg = 0;
      let currentRatingCount = 0;
      let currentDealsCount = 0;

      if (userSnap.exists) {
        const userData = userSnap.data() || {};
        currentRatingAvg = userData.rating_avg || 0;
        currentRatingCount = userData.rating_count || 0;
        currentDealsCount = userData.deals_count || 0;
      }

      const newRatingCount = currentRatingCount + 1;
      const newRatingAvg = ((currentRatingAvg * currentRatingCount) + numRating) / newRatingCount;
      const newDealsCount = currentDealsCount + 1; // 1 review = 1 successful transaction recorded

      // Commit the review
      transaction.set(reviewRef, newReview);

      // Commit user updates (Create stub user profile if it doesn't exist)
      transaction.set(userRef, {
        rating_avg: Number(newRatingAvg.toFixed(2)),
        rating_count: newRatingCount,
        deals_count: newDealsCount,
        
        // Preservation of metadata or initialization
        telegram_id: String(seller_telegram_id),
        username: seller_username || (userSnap.exists ? userSnap.get('username') : null),
        first_name: userSnap.exists ? userSnap.get('first_name') : (seller_username ? `@${seller_username}` : 'Pulse Seller'),
        trust_score: userSnap.exists ? userSnap.get('trust_score') : 50,
        verified_level: userSnap.exists ? userSnap.get('verified_level') : 0,
        role: userSnap.exists ? userSnap.get('role') : 'expat'
      }, { merge: true });
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully and metrics aggregated.',
      data: newReview
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST Review Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error while processing review.'
    }, { status: 500 });
  }
}
