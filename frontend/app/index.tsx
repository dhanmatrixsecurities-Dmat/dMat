import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is signed in, go to main app
        router.replace('/(tabs)');
      } else {
        // User is not signed in, show disclaimer first
        router.replace('/auth/disclaimer');
      }
    }
  }, [user, loading]);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060c1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
