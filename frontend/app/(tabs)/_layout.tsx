import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';

export default function TabLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: {
            backgroundColor: Colors.cardBackground,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.secondary,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="active-trades"
          options={{
            title: 'Active Trades',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pulse" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="closed-trades"
          options={{
            title: 'Closed Trades',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkmark-done" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="ajeeb"
          options={{
            title: '🤖 ai',
            headerTitle: () => (
              <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>
                  {'Ajeeb ai'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '500', letterSpacing: 0.4 }}>
                  {'ai Judgment Engine for Equity & Bourse'}
                </Text>
              </View>
            ),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="sparkles" size={size} color={color} />
            ),
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
