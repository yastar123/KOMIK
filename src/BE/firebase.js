import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBIPWJtrNHHas2qobYxqVWvh_T7wiQRjWk",
    authDomain: "komik-f4c68.firebaseapp.com",
    projectId: "komik-f4c68",
    storageBucket: "komik-f4c68.firebasestorage.app",
    messagingSenderId: "179800085061",
    appId: "1:179800085061:web:d5a77f54f48fff0e32c92c",
    measurementId: "G-RLKNCNHXKR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Konfigurasi untuk Google Auth
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

export { db, auth, googleProvider, collection, addDoc, getDocs };
