
import '@/firebaseConfig';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

// MUST be outside component at top level
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error }: any) => {
  if (error) {
    console.error('Background notification error:', error);
    return;
  }
  if (data) {
    console.log('Background notification received:', data);
  }
});

// Foreground handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function setupNotifications() {
  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Notification permission denied');
    return;
  }

  // Android channel
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

  // Register background task
  await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

  // Get push token
  const token = await Notifications.getExpoPushTokenAsync();
  console.log('Expo Push Token:', token.data);
}

export default function RootLayout() {
  useEffect(() => {
    setupNotifications();

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Foreground notification:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
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
