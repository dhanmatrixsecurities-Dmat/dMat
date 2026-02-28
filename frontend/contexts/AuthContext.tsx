import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import {
  PhoneAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type UserStatus = 'FREE' | 'ACTIVE' | 'BLOCKED';

interface UserData {
  phone: string;
  email: string;
  status: UserStatus;
  fcmToken?: string;
  createdAt: string;
  name?: string;
  subscriptionEndDate?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithPhone: (verificationId: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  // ✅ Store real-time user listener ref
  const userDataUnsubscribeRef = useRef<(() => void) | null>(null);

  const registerForPushNotifications = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return null;

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) return null;

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  };

  // ✅ Manual refresh still works for pull-to-refresh on profile
  const refreshUserData = async () => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) setUserData(userDoc.data() as UserData);
    }
  };

  // ✅ Real-time listener — fires automatically when admin changes status/subscription
  const startUserDataListener = (uid: string) => {
    if (userDataUnsubscribeRef.current) userDataUnsubscribeRef.current();

    const unsubscribe = onSnapshot(
      doc(db, 'users', uid),
      (docSnap) => {
        if (docSnap.exists()) setUserData(docSnap.data() as UserData);
        setLoading(false);
      },
      (error) => {
        console.error('User data listener error:', error);
        setLoading(false);
      }
    );

    userDataUnsubscribeRef.current = unsubscribe;
  };

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(n => {
      console.log('Notification received:', n);
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener(r => {
      console.log('Notification tapped:', r);
    });

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const fcmToken = await registerForPushNotifications();
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          const updates: Partial<UserData> = {};

          if (fcmToken && fcmToken !== data.fcmToken) updates.fcmToken = fcmToken;

          const currentEmail = firebaseUser.email || '';
          if (currentEmail && currentEmail !== data.email) updates.email = currentEmail;

          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, 'users', firebaseUser.uid), updates);
          }
        } else {
          // New user
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            phone: firebaseUser.phoneNumber || '',
            email: firebaseUser.email || '',
            status: 'FREE',
            fcmToken: fcmToken || '',
            createdAt: new Date().toISOString(),
            name: '',
            subscriptionEndDate: '',
          });
        }

        // ✅ Start real-time listener — updates instantly when admin changes anything
        startUserDataListener(firebaseUser.uid);

      } else {
        // Logged out
        if (userDataUnsubscribeRef.current) {
          userDataUnsubscribeRef.current();
          userDataUnsubscribeRef.current = null;
        }
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (userDataUnsubscribeRef.current) userDataUnsubscribeRef.current();
    };
  }, []);

  const signInWithPhone = async (verificationId: string, code: string) => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithPhone, signOut, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
