import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function test() {
  console.log('Testing Firestore connection...');
  try {
    const apps = getApps();
    if (!apps.length) {
      initializeApp();
    }
    const db = getFirestore();
    const snapshot = await db.collection('listings').limit(1).get();
    console.log('Success! Found', snapshot.size, 'listings');
  } catch (error) {
    console.error('Firestore connection failed:', error);
  }
}

test();
