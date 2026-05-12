const admin = require('firebase-admin');
process.env.GOOGLE_CLOUD_PROJECT = "pulsemarket-group-app";

try {
  admin.initializeApp({ projectId: 'pulsemarket-group-app' });
} catch(e) {}

const db = admin.firestore();

async function fixNewsOrder() {
  console.log("Fetching news to fix ordering...");
  const snapshot = await db.collection('listings').where('category', '==', 'Новости').get();
  
  const newsItems = [];
  snapshot.forEach(doc => {
      const data = doc.data();
      // Use external_id (Telegram msg ID) to determine true chronological order
      // Higher external_id means NEWER news.
      const msgId = parseInt(data.external_id || '0');
      newsItems.push({ id: doc.id, msgId: msgId, title: data.title });
  });

  // Sort ascending: lowest msgId (oldest) first, highest msgId (newest) last
  newsItems.sort((a, b) => a.msgId - b.msgId);

  console.log(`Found ${newsItems.length} news items. Rewriting timestamps...`);

  // We want the newest to have the most recent timestamp.
  // We'll base it off a recent timestamp and subtract seconds going backwards.
  const baseTime = Date.now();
  const batch = db.batch();

  newsItems.forEach((item, index) => {
      // index 0 is oldest. If there are 40 items, index 0 gets (baseTime - 40 minutes)
      // index 39 (newest) gets (baseTime - 1 minute)
      const newTimestamp = new Date(baseTime - ((newsItems.length - index) * 60000)).toISOString();
      const docRef = db.collection('listings').doc(item.id);
      batch.update(docRef, { createdAt: newTimestamp, updatedAt: newTimestamp });
      console.log(`Setting ${item.msgId} (Index ${index}): ${item.title.substring(0, 30)} -> ${newTimestamp}`);
  });

  await batch.commit();
  console.log("✅ News ordering successfully fixed!");
  process.exit(0);
}

fixNewsOrder();
