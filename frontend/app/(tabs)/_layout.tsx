import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';

export default function TabLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      <Tabs
        initialRouteName="index"
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: {
            backgroundColor: Colors.cardBackground,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
          // Kills the v7 circle/pill gap
          tabBarActiveIndicatorStyle: {
            backgroundColor: 'transparent',
            height: 0,
          },
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.secondary,
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />

        <Tabs.Screen
          name="active-trades"
          options={{
            title: 'Active Trades',
            tabBarIcon: ({ color, size }) => <Ionicons name="pulse" size={size} color={color} />,
          }}
        />

        <Tabs.Screen
          name="closed-trades"
          options={{
            title: 'Closed Trades',
            tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-done" size={size} color={color} />,
          }}
        />

        <Tabs.Screen
          name="ajeeb"
          options={{
            title: '🤖 ai',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          }}
        />

        {/* href: null completely removes from tab bar — no invisible space left */}
        <Tabs.Screen
          name="portfolio-stocks"
          options={{
            href: null,
            title: 'Portfolio Stocks',
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
