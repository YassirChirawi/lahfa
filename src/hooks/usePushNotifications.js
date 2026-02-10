import { useState, useEffect } from 'react';
import { messaging, db } from '../firebase';
import { getToken } from 'firebase/messaging';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const VAPID_KEY = "BMPWiSQ3Ac4fPHjw0pJK4lquUTyyWP8Q6KWw2kB3ozn_3bE-_S3fKeqaRCI9z5m8JVVvPY2saT4V2NMjINS-5Z0"; // User provided Key

const usePushNotifications = () => {
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        setPermission(Notification.permission);
    }, []);

    const requestPermission = async () => {
        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult === 'granted') {
                const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
                if (currentToken) {
                    console.log('FCM Token:', currentToken);
                    // Save token to Firestore
                    // use a fixed ID for single admin or generate one per device
                    // For now, let's store it under 'admin_tokens' collection with the token as ID to avoid dupes
                    await setDoc(doc(db, 'fcm_tokens', currentToken), {
                        token: currentToken,
                        updatedAt: new Date().toISOString(),
                        device: navigator.userAgent
                    });
                    toast.success("Notifications activées !");
                } else {
                    console.log('No registration token available. Request permission to generate one.');
                }
            } else {
                toast.error("Permission refusée pour les notifications.");
            }
        } catch (error) {
            console.error('An error occurred while retrieving token. ', error);
            toast.error("Erreur d'activation des notifications.");
        }
    };

    return { permission, requestPermission };
};

export default usePushNotifications;
