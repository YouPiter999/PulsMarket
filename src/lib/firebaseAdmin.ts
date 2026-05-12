import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const getFirestoreDb = () => {
  const apps = getApps();
  if (!apps.length) {
    try {
      // In cloud environments, it auto-initializes. 
      initializeApp();
      console.log('Firebase Admin modular initialized.');
    } catch (error) {
      console.warn('Firebase initialization failed (ignore if local build without keys):', error);
    }
  }
  return getFirestore();
};
