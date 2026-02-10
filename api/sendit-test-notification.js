// api/sendit-test-notification.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

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

    // Initialize Firebase Admin SDK INSIDE handler to catch errors
    // Use modular getApps() instead of admin.apps
    if (getApps().length === 0) {
        try {
            const serviceAccountData = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (!serviceAccountData) {
                throw new Error("FIREBASE_SERVICE_ACCOUNT env var is missing");
            }

            // Handle both stringified JSON and potential object anomalies
            let serviceAccount;
            try {
                serviceAccount = typeof serviceAccountData === 'string'
                    ? JSON.parse(serviceAccountData)
                    : serviceAccountData;
            } catch (parseError) {
                throw new Error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: " + parseError.message);
            }

            initializeApp({
                credential: cert(serviceAccount)
            });
        } catch (e) {
            console.error("Firebase Admin Init Error:", e);
            return res.status(500).json({
                message: 'Firebase Admin Init Failed',
                error: e.toString(),
                envVarExists: !!process.env.FIREBASE_SERVICE_ACCOUNT
            });
        }
    }

    try {
        const db = getFirestore();
        const messaging = getMessaging();
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
                body: customMessage,
                icon: '/pwa-192x192.png', // Logo
                badge: '/pwa-192x192.png' // Android Small Icon (usually needs to be monochrome, but this helps)
            },
            tokens: tokens
        };

        const response = await messaging.sendEachForMulticast(notificationPayload);

        return res.status(200).json({
            message: 'Test notification processed',
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response.responses
        });

    } catch (error) {
        console.error("Test Notification Error:", error);
        return res.status(500).json({
            message: 'Error executing test notification',
            error: error.toString(),
            stack: error.stack,
            envVarExists: !!process.env.FIREBASE_SERVICE_ACCOUNT
        });
    }
}
