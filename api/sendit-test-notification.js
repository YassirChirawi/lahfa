// api/sendit-test-notification.js
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (Same as webhook)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        if (serviceAccount.project_id) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
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
        const { message } = req.body;
        const customMessage = message || "test notif a ziiiin";

        // Fetch all tokens
        const tokensSnap = await db.collection('fcm_tokens').get();
        if (tokensSnap.empty) {
            return res.status(404).json({ message: 'No devices registered for notifications.' });
        }

        const tokens = tokensSnap.docs.map(doc => doc.data().token).filter(t => t);

        if (tokens.length === 0) {
            return res.status(404).json({ message: 'No valid tokens found.' });
        }

        const notificationPayload = {
            notification: {
                title: 'Test Notification',
                body: customMessage
            },
            tokens: tokens
        };

        const response = await messaging.sendMulticast(notificationPayload);

        return res.status(200).json({
            message: 'Test notification sent',
            successCount: response.successCount,
            failureCount: response.failureCount
        });

    } catch (error) {
        console.error("Test Notification Error:", error);
        return res.status(500).json({ message: 'Error sending test notification', error: error.toString() });
    }
}
