import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import fetch from 'node-fetch'; // Ensure node-fetch is available or use native fetch if Node 18+

// Read JSON manually because JSON imports might need flags
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountPath) {
    console.error("FIREBASE_SERVICE_ACCOUNT env var not set");
    process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkOrder() {
    try {
        const phone = "0684351835";
        const cleanPhone = phone.replace(/\D/g, '').replace(/^212/, '0');
        const fullPhone = `212${cleanPhone.substring(1)}`;

        console.log(`Checking orders for phone: ${cleanPhone} OR ${fullPhone}...`);

        const ordersRef = db.collection('orders');
        const q1 = await ordersRef.where('phone', '==', cleanPhone).get();
        const q2 = await ordersRef.where('phone', '==', fullPhone).get();

        console.log(`Query 1 (clean): ${q1.size} docs`);
        console.log(`Query 2 (full): ${q2.size} docs`);

        if (q1.empty && q2.empty) {
            console.log("❌ No orders found for this phone number.");

            // Try listing last 10 orders to see phone format
            console.log("\n--- Listing last 5 orders to inspect phone formats ---");
            const lastOrders = await ordersRef.orderBy('date', 'desc').limit(5).get();
            lastOrders.forEach(doc => {
                console.log(`ID: ${doc.id}, Phone: '${doc.data().phone}', Status: ${doc.data().status}`);
            });

        } else {
            console.log("✅ Orders found!");
            q1.forEach(doc => console.log(`[Clean Match] ID: ${doc.id}, Status: ${doc.data().status}, Phone: ${doc.data().phone}`));
            q2.forEach(doc => console.log(`[Full Match] ID: ${doc.id}, Status: ${doc.data().status}, Phone: ${doc.data().phone}`));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkOrder();
