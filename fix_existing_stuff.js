const admin = require('firebase-admin');
process.env.GOOGLE_CLOUD_PROJECT = "pulsemarket-group-app";

try {
  admin.initializeApp({ projectId: 'pulsemarket-group-app' });
} catch(e) {}

const db = admin.firestore();

async function fixStuffCategory() {
  console.log("Scanning for items that should be 'Вещи'...");
  
  const snapshot = await db.collection('listings').get();
  let updatedCount = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
      const data = doc.data();
      const title = (data.title || "").toLowerCase();
      const description = (data.description || "").toLowerCase();
      const fullText = title + " " + description;

      // Check keywords for Stuff
      const stuffKeywords = ["шлеп", "обувь", "одежда", "кроссовк", "кеды", "вещи"];
      const isStuff = stuffKeywords.some(kw => fullText.includes(kw));

      // Check if listing is NOT Real Estate, but currently tagged as Other/Unknown
      // Or if it's literally "Шлепанцы" which MUST be stuff!
      if (isStuff) {
          console.log(`🔨 Found target: ${data.title.substring(0, 30)}...`);
          const updates = {};
          
          // 1. Correct the category
          if (data.category !== "Вещи") {
              updates.category = "Вещи";
          }
          
          // 2. REMOVE FAKE ROOM METADATA for non-real-estate!
          if (data.metadata && data.metadata.rooms) {
              console.log(`🧹 Removing fake room metadata (${data.metadata.rooms}) from non-real-estate item.`);
              const newMetadata = { ...data.metadata };
              delete newMetadata.rooms;
              updates.metadata = newMetadata;
          }

          // Only update if changes actually are pending
          if (Object.keys(updates).length > 0) {
              batch.update(doc.ref, updates);
              updatedCount++;
          }
      }
  });

  if (updatedCount > 0) {
      console.log(`Committing changes to ${updatedCount} items...`);
      await batch.commit();
      console.log("✅ Successfully corrected categories and removed junk metadata!");
  } else {
      console.log("No matching items needed fixes.");
  }
  
  process.exit(0);
}

fixStuffCategory().catch(e => {
    console.error("Error:", e);
    process.exit(1);
});
