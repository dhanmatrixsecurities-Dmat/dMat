import '@/firebaseConfig';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {}

async function setupNotifications() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }
  } catch (e) {}
}

export default function RootLayout() {
  useEffect(() => {
    setupNotifications();
    let subscription: any;
    let responseSubscription: any;
    try {
      subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });
      responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
      });
    } catch (e) {}
    return () => {
      try { subscription?.remove(); } catch (e) {}
      try { responseSubscription?.remove(); } catch (e) {}
    };
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/phone-login" />
        <Stack.Screen name="auth/disclaimer" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}
