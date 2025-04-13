import { initializeApp } from "firebase/app";
import { getFirestore, setDoc } from "firebase/firestore";

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
const db = getFirestore(app);
const collection = db.collection;
const addDoc = db.addDoc;
const getDocs = db.getDocs;

export { db, collection, addDoc, getDocs };
