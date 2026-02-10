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
        console.log("Checking order ORD-0005...");
        // 1. Get Order
        const ordersRef = db.collection('orders');
        const snapshot = await ordersRef.where('displayId', '==', 'ORD-0005').get();

        if (snapshot.empty) {
            console.log('Order ORD-0005 not found in Firestore');
            return;
        }

        let orderData = null;
        let orderId = null;
        snapshot.forEach(doc => {
            orderData = doc.data();
            orderId = doc.id;
        });

        console.log(`Found Order: ${orderId} (Reference: #${orderData.id})`);
        console.log('Current Delivery Values:', orderData.deliveryValues);

        if (orderData.deliveryValues?.trackingID) {
            console.log("Order already has trackingID:", orderData.deliveryValues.trackingID);
            return;
        }

        // 2. Get Sendit Credentials
        console.log("Fetching Sendit credentials...");
        const settingsDoc = await db.collection('settings').doc('delivery').get();
        if (!settingsDoc.exists) {
            console.error("Settings not found");
            return;
        }
        const settings = settingsDoc.data();
        const { publicKey, secretKey } = settings.sendit;

        // 3. Authenticate Sendit
        console.log("Authenticating with Sendit...");
        const loginRes = await fetch('https://app.sendit.ma/api/v1/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ public_key: publicKey, secret_key: secretKey })
        });
        const loginData = await loginRes.json();
        if (!loginData.success) {
            console.error("Sendit Login Failed:", loginData);
            return;
        }
        const token = loginData.data.token;
        console.log("Logged in!");

        // 4. Search for Order
        // Search by reference seems not directly supported by list endpoint filter?
        // We'll fetch latest 50 and filter manually.
        console.log("Fetching recent deliveries...");
        const deliveriesRes = await fetch('https://app.sendit.ma/api/v1/deliveries?limit=50', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const deliveriesData = await deliveriesRes.json();

        if (!deliveriesData.success) {
            console.error("Failed to fetch deliveries:", deliveriesData);
            return;
        }

        const deliveries = deliveriesData.data.data; // paginated response structure
        const targetRef = `#${orderData.id}`; // The reference we sent

        console.log(`Searching for reference: "${targetRef}" in ${deliveries.length} recent deliveries...`);

        const foundDelivery = deliveries.find(d => d.reference === targetRef || d.note?.includes(targetRef));

        if (foundDelivery) {
            console.log("\n✅ FOUND MATCHING DELIVERY!");
            console.log("Tracking ID:", foundDelivery.tracking_id);
            console.log("Status:", foundDelivery.status);
            console.log("Ref:", foundDelivery.reference);

            // Optional: Update Firestore?
            // await db.collection('orders').doc(orderId).update({
            //     'deliveryValues.trackingID': foundDelivery.tracking_id,
            //     'deliveryValues.provider': 'sendit',
            //     'deliveryValues.status': foundDelivery.status,
            //     'deliveryValues.lastSync': new Date().toISOString()
            // });
            // console.log("Updated Firestore with tracking ID.");
        } else {
            console.log("\n❌ NO MATCH FOUND in last 50 deliveries.");
            console.log("Latest 5 refs:", deliveries.slice(0, 5).map(d => d.reference).join(', '));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkOrder();
