// Firebase Configuration
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration - Auto-configured from google-services.json
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

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
} catch (error: any) {
  // If auth is already initialized, just get it
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };