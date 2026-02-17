import { initializeApp } from 'firebase/app';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };