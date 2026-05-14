const admin = require('firebase-admin');
process.env.GOOGLE_CLOUD_PROJECT = "pulsemarket-group-app";

try {
  admin.initializeApp({ projectId: 'pulsemarket-group-app' });
} catch(e) {}

const db = admin.firestore();

async function search() {
    console.log('Connecting directly to Firestore via application credentials...');
    const snapshot = await db.collection('listings').get();
    console.log(`Total documents scanned: ${snapshot.docs.length}`);
    
    let found = false;
    snapshot.forEach(doc => {
        const d = doc.data();
        const rawStr = JSON.stringify(d);
        if (rawStr.includes('Карингтон') || rawStr.includes('Carrington') || rawStr.includes('195967') || (d.price === 800 && d.location === 'Эсентепе')) {
            found = true;
            console.log('\n🔥 MATCH FOUND IN FIRESTORE!');
            console.log(JSON.stringify({
                id: doc.id,
                createdAt: d.createdAt,
                title: d.title,
                location: d.location,
                price: d.price,
                status: d.status,
                category: d.category,
                external_id: d.external_id,
                source: d.source,
                username: d.username
            }, null, 2));
        }
    });
    
    if (!found) {
        console.log('\n❌ No matches found in entire listings collection.');
    }
    process.exit(0);
}

search().catch(console.error);
