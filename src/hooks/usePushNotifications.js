import { useState, useEffect } from 'react';
import { messaging, db } from '../firebase';
import { getToken } from 'firebase/messaging';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const VAPID_KEY = "BMPWiSQ3Ac4fPHjw0pJK4lquUTyyWP8Q6KWw2kB3ozn_3bE-_S3fKeqaRCI9z5m8JVVvPY2saT4V2NMjINS-5Z0"; // User provided Key

const usePushNotifications = () => {
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        if (permission === 'granted') {
            retrieveToken();
        }
    }, [permission]);

    const retrieveToken = async () => {
        try {
            const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (currentToken) {
                console.log('FCM Token:', currentToken);
                await setDoc(doc(db, 'fcm_tokens', currentToken), {
                    token: currentToken,
                    updatedAt: new Date().toISOString(),
                    device: navigator.userAgent
                });
            } else {
                console.log('No registration token available.');
            }
        } catch (error) {
            console.error('An error occurred while retrieving token. ', error);
        }
    };

    const requestPermission = async () => {
        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);
            if (permissionResult === 'granted') {
                await retrieveToken();
                toast.success("Notifications activées !");
            } else {
                toast.error("Permission refusée.");
            }
        } catch (error) {
            console.error('Error requesting permission', error);
            toast.error("Erreur d'activation.");
        }
    };

    return { permission, requestPermission };
};

export default usePushNotifications;
