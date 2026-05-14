const admin = require('firebase-admin');
process.env.GOOGLE_CLOUD_PROJECT = "pulsemarket-group-app";

try {
  admin.initializeApp({ projectId: 'pulsemarket-group-app' });
} catch(e) {}

const db = admin.firestore();

async function purgeSharabara() {
  console.log("🚀 Starting Sharabara purge from Firestore...");
  const snapshot = await db.collection('listings').get();
  
  console.log(`Scanned ${snapshot.size} total documents.`);
  let count = 0;

  const batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
      const data = doc.data();
      const source = String(data.source || '').toLowerCase();
      const title = String(data.title || '').toLowerCase();
      const desc = String(data.description || '').toLowerCase();
      const username = String(data.username || '').toLowerCase();
      
      const isMatch = source.includes('sharabara') || 
                      title.includes('sharabara') || 
                      desc.includes('sharabara') ||
                      username.includes('sharabara');

      if (isMatch) {
          console.log(`🚨 MATCH DETECTED: Deleting Doc [${doc.id}] | Title: "${data.title.substring(0, 40)}" | Source: "${data.source}"`);
          batch.delete(doc.ref);
          count++;
          batchCount++;
          
          if (batchCount >= 400) {
              console.log("Committing sub-batch of 400...");
              await batch.commit();
              batchCount = 0;
          }
      }
  }

  if (batchCount > 0) {
      await batch.commit();
  }

  console.log(`✅ Completed Sharabara Purge! Total deleted items: ${count}`);
  process.exit(0);
}

purgeSharabara().catch(err => {
  console.error("❌ Error during purge:", err);
  process.exit(1);
});
