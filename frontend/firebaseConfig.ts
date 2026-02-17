// Firebase Configuration
// Replace these values with your actual Firebase config after setup

import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };