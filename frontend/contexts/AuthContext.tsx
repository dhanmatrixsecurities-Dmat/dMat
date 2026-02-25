import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  PhoneAuthProvider, 
  signInWithCredential, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type UserStatus = 'FREE' | 'ACTIVE' | 'BLOCKED';

interface UserData {
  phone: string;
  email: string; // ✅ ADDED
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

  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  };

  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const refreshUserData = async () => {
    if (user) {
      const data = await fetchUserData(user.uid);
      setUserData(data);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // ✅ Always get fresh FCM token on every login
        const fcmToken = await registerForPushNotifications();
        const data = await fetchUserData(firebaseUser.uid);
        
        if (data) {
          // ✅ Always update email + fcmToken for existing users
          const updates: Partial<UserData> = {};
          
          if (fcmToken && fcmToken !== data.fcmToken) {
            updates.fcmToken = fcmToken;
          }
          
          const currentEmail = firebaseUser.email || '';
          if (currentEmail && currentEmail !== data.email) {
            updates.email = currentEmail;
          }

          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, 'users', firebaseUser.uid), updates);
          }

          setUserData({ ...data, ...updates });
        } else {
          // New user — create document
          const newUserData: UserData = {
            phone: firebaseUser.phoneNumber || '',
            email: firebaseUser.email || '', // ✅ Save email on creation
            status: 'FREE',
            fcmToken: fcmToken || '',
            createdAt: new Date().toISOString(),
            name: '',
            subscriptionEndDate: '',
          };
          
          await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
          setUserData(newUserData);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithPhone = async (verificationId: string, code: string) => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.error('Error signing in with phone:', error);
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
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signInWithPhone,
        signOut,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
