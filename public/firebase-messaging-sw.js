/* eslint-disable no-undef */
// Give the service worker access to Firebase Messaging.
// Note: These must match the version used in the app, or be compatible.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
    apiKey: "AIzaSyB8phOaXGPN_W_m3dHcmlkOdm9msVnwy6U",
    authDomain: "lahfa-77f68.firebaseapp.com",
    projectId: "lahfa-77f68",
    storageBucket: "lahfa-77f68.firebasestorage.app",
    messagingSenderId: "908524659828",
    appId: "1:908524659828:web:d7038626286bbafcecdd21",
    measurementId: "G-RJVQ2TGZLZ"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pwa-192x192.png' // Ensure this path is correct
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
