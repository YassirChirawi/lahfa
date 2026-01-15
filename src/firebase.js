import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB8phOaXGPN_W_m3dHcmlkOdm9msVnwy6U",
    authDomain: "lahfa-77f68.firebaseapp.com",
    projectId: "lahfa-77f68",
    storageBucket: "lahfa-77f68.firebasestorage.app",
    messagingSenderId: "908524659828",
    appId: "1:908524659828:web:d7038626286bbafcecdd21",
    measurementId: "G-RJVQ2TGZLZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
