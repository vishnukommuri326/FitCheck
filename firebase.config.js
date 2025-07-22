// firebase.config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABpK0C_2LKfNg-oj0Y3054n9npduc9o8s",
  authDomain: "fitcheck-1c224.firebaseapp.com",
  projectId: "fitcheck-1c224",
  storageBucket: "fitcheck-1c224.firebasestorage.app",
  messagingSenderId: "768571758877",
  appId: "1:768571758877:web:fda3cf7367ad03a640a9f4",
  measurementId: "G-E27C8KWVK4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;