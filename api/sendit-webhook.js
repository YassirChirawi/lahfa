// api/sendit-webhook.js
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// We need to check if it's already initialized to avoid "default app already defined" errors in hot reloads
if (!admin.apps.length) {
    // In Vercel, we will store the Service Account JSON in an environment variable
    // FIREBASE_SERVICE_ACCOUNT
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        if (serviceAccount.project_id) { // Basic check to see if it's valid
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            console.warn("Missing or invalid FIREBASE_SERVICE_ACCOUNT env var. Init skipped or failed.");
        }
    } catch (e) {
        console.error("Firebase Admin Init Error:", e);
    }
}

const db = admin.firestore();
const messaging = admin.messaging();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const body = req.body;
        console.log("Sendit Webhook Received:", body);

        // Sendit Payload variations:
        // 1. { code: "TRACK123", status: "Livré", ... }
        // 2. { data: { code: "...", status: "..." } } (?) - preparing for both
        const trackingID = body.code || body.data?.code || body.tracking_code;
        const newStatus = body.status || body.data?.status;

        if (!trackingID || !newStatus) {
            console.warn("⚠️ Invalid Payload:", body);
            // Return 200 to acknowledge receipt and prevent indefinite retries
            return res.status(200).json({
                message: 'Payload missing trackingID or status',
                received: body
            });
        }

        // 1. Find the order with this trackingID (in deliveryValues.trackingID)
        const ordersRef = db.collection('orders');
        const snapshot = await ordersRef.where('deliveryValues.trackingID', '==', String(trackingID)).get();

        if (snapshot.empty) {
            console.log(`Checking normalized tracking ID...`);
            // Add fallback logic if needed
            return res.status(200).json({ message: 'Order not found', trackingID });
        }

        let updates = 0;
        const promises = snapshot.docs.map(async (doc) => {
            const order = doc.data();
            const currentStatus = order.deliveryValues?.status;

            if (currentStatus !== newStatus) {
                // Update Firestore
                await doc.ref.update({
                    'deliveryValues.status': newStatus,
                    'deliveryValues.lastChecked': new Date().toISOString()
                });

                // Send Push Notification
                await sendPushNotification(order, newStatus);
                updates++;
            }
        });

        await Promise.all(promises);

        return res.status(200).json({
            message: 'Webhook processed successfully',
            updatesMade: updates,
            trackingID,
            newStatus
        });

    } catch (error) {
        console.error("Webhook Error:", error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.toString() });
    }
}

// Helper to send FCM Notification
async function sendPushNotification(order, newStatus) {
    try {
        // Fetch all tokens
        const tokensSnap = await db.collection('fcm_tokens').get();
        if (tokensSnap.empty) return;

        const tokens = tokensSnap.docs.map(doc => doc.data().token).filter(t => t);

        if (tokens.length === 0) return;

        const message = {
            notification: {
                title: `Mise à jour Commande #${order.displayId || 'Inconnue'}`,
                body: `Nouveau statut: ${newStatus}`
            },
            data: {
                orderId: order.id || '',
                url: '/dashboard' // Action URL if supported by SW
            },
            tokens: tokens
        };

        const response = await messaging.sendMulticast(message);
        console.log('Notifications sent:', response.successCount, 'failures:', response.failureCount);

    } catch (e) {
        console.error("FCM Send Error:", e);
    }
}
