import { getFirestoreDb } from './src/lib/firebaseAdmin';

async function main() {
    const db = getFirestoreDb();
    const snapshot = await db.collection('listings').get();
    console.log(`Total documents in Firestore: ${snapshot.docs.length}`);
    
    snapshot.docs.forEach(doc => {
        const d = doc.data();
        if (d.description && d.description.includes('Grand Sapphire')) {
            console.log('FOUND MATCH:', {
                id: doc.id,
                createdAt: d.createdAt,
                status: d.status,
                category: d.category,
                external_id: d.external_id
            });
        }
    });
    process.exit(0);
}

main().catch(console.error);
