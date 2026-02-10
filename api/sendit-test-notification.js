// api/sendit-test-notification.js
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// We do this check first to avoid issues
if (!admin.apps.length) {
    try {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            console.error("FIREBASE_SERVICE_ACCOUNT variable is missing!");
        } else {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
    } catch (e) {
        console.error("Firebase Admin Init Error:", e);
    }
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Diagnostic check
    if (!admin.apps.length) {
        return res.status(500).json({
            message: 'Firebase Admin not initialized. Likely missing FIREBASE_SERVICE_ACCOUNT env var.',
            envVarExists: !!process.env.FIREBASE_SERVICE_ACCOUNT
        });
    }

    const db = admin.firestore();
    const messaging = admin.messaging();

    try {
        const { message } = req.body;
        const customMessage = message || "test notif a ziiiin";

        // Fetch all tokens
        const tokensSnap = await db.collection('fcm_tokens').get();
        if (tokensSnap.empty) {
            return res.status(404).json({ message: 'No devices registered for notifications (fcm_tokens is empty).' });
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
            message: 'Test notification processed',
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response.responses
        });

    } catch (error) {
        console.error("Test Notification Error:", error);
        return res.status(500).json({
            message: 'Error sending test notification',
            error: error.toString(),
            stack: error.stack
        });
    }
}
