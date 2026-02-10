// api/sendit-webhook.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
    try {
        const serviceAccountData = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccountData) {
            let serviceAccount;
            try {
                serviceAccount = typeof serviceAccountData === 'string'
                    ? JSON.parse(serviceAccountData)
                    : serviceAccountData;

                if (serviceAccount.project_id) {
                    initializeApp({
                        credential: cert(serviceAccount)
                    });
                }
            } catch (parseError) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", parseError);
            }
        }
    } catch (e) {
        console.error("Firebase Admin Init Error:", e);
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Safe check for initialization
        if (getApps().length === 0) {
            console.error("Firebase Admin not initialized in webhook.");
            return res.status(500).json({ message: 'Server Configuration Error' });
        }

        const db = getFirestore();
        const body = req.body;
        console.log("Sendit Webhook Received:", body);

        const trackingID = body.code || body.data?.code || body.tracking_code;
        const newStatus = body.status || body.data?.status;

        if (!trackingID || !newStatus) {
            console.warn("⚠️ Invalid Payload:", body);
            return res.status(200).json({
                message: 'Payload missing trackingID or status',
                received: body
            });
        }

        const ordersRef = db.collection('orders');
        const snapshot = await ordersRef.where('deliveryValues.trackingID', '==', String(trackingID)).get();

        if (snapshot.empty) {
            // Check legacy location or other possibilities if needed
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
        const db = getFirestore();
        const messaging = getMessaging();

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
                url: '/dashboard'
            },
            tokens: tokens
        };

        // Use sendEachForMulticast instead of deprecated sendMulticast
        const response = await messaging.sendEachForMulticast(message);
        console.log('Notifications sent:', response.successCount, 'failures:', response.failureCount);

    } catch (e) {
        console.error("FCM Send Error:", e);
    }
}
