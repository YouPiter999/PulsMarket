import { getFirestoreDb } from './src/lib/firebaseAdmin';

async function main() {
    console.log('Connecting to Firestore...');
    const db = getFirestoreDb();
    const snapshot = await db.collection('listings').get();
    console.log(`Total documents scanned: ${snapshot.docs.length}`);
    
    let found = false;
    snapshot.docs.forEach(doc => {
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
                source: d.source
            }, null, 2));
        }
    });
    
    if (!found) {
        console.log('\n❌ No matches found in entire listings collection.');
    }
    process.exit(0);
}

main().catch(console.error);
