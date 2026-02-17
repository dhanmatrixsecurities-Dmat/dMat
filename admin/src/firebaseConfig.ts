import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - Same as mobile app
const firebaseConfig = {
  apiKey: "AIzaSyAB15tMu9OpirH-u9TjyUVhCe-V-oEcK_8",
  authDomain: "dmat-b0ce6.firebaseapp.com",
  projectId: "dmat-b0ce6",
  storageBucket: "dmat-b0ce6.firebasestorage.app",
  messagingSenderId: "160685363693",
  appId: "1:160685363693:android:12d10447fb5c0c040ad7e4"
};

// Initialize Firebase (prevent multiple initializations)
const app = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApps()[0];

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };