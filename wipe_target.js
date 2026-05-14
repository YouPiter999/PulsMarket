const admin = require('firebase-admin');
const serviceAccount = require('./pulsemarket-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function wipeQuestions() {
  const snapshot = await db.collection('listings').get();
  let wiped = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const text = ((data.title || '') + ' ' + (data.description || '')).toLowerCase();
    if (text.includes('сезонах') || (text.includes('этаж') && text.includes('?') && text.length < 80)) {
      console.log(`🗑️ Found target: [${doc.id}] - ${text.substring(0, 40)}`);
      await doc.ref.delete();
      wiped++;
    }
  }
  console.log(`COMPLETED. Wiped ${wiped} question(s).`);
}
wipeQuestions();
