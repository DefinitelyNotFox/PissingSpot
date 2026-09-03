import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCJh0zE3N40q4wEXx_tJXVILQ1yuVhJSN0",
  authDomain: "pissingspot.firebaseapp.com",
  projectId: "pissingspot",
  storageBucket: "pissingspot.firebasestorage.app",
  messagingSenderId: "725846119832",
  appId: "1:725846119832:web:0b26cd6de97ead99b407ed",
  measurementId: "G-P5ZGSXPKG3"
};

// Initialize Firebase safely (avoid double initialization in HMR)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Cloud Firestore Database
export const db = getFirestore(app);
