import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

function TabLayoutInner() {
  const theme = useTheme();
  return (
    <>
      <StatusBar style="light" backgroundColor={theme.headerBg} />
      <Tabs
        initialRouteName="index"
        screenOptions={{
          tabBarActiveTintColor:   theme.primary,
          tabBarInactiveTintColor: theme.tabInactiveTint,
          tabBarStyle: {
            backgroundColor: theme.tabBarBg,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            height: 58,
            paddingBottom: 6,
            paddingTop: 4,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          tabBarItemStyle:  { flex: 1 },
          // Kill default v7 pill indicator completely
          tabBarActiveIndicatorStyle: {
            backgroundColor: 'transparent',
            height: 0,
          },
          // Custom tab bar icon with bottom line built in
          tabBarIcon: undefined,
          headerStyle:      { backgroundColor: theme.headerBg },
          headerTintColor:  '#ffffff',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, focused, size }) => (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="home" size={size} color={color} />
                {focused && (
                  <View style={{ position: 'absolute', bottom: -10, width: 24, height: 3, borderRadius: 2, backgroundColor: theme.primary }} />
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="active-trades"
          options={{
            title: 'Active Trades',
            tabBarIcon: ({ color, focused, size }) => (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="pulse" size={size} color={color} />
                {focused && (
                  <View style={{ position: 'absolute', bottom: -10, width: 24, height: 3, borderRadius: 2, backgroundColor: theme.primary }} />
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="closed-trades"
          options={{
            title: 'Closed Trades',
            tabBarIcon: ({ color, focused, size }) => (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="checkmark-done" size={size} color={color} />
                {focused && (
                  <View style={{ position: 'absolute', bottom: -10, width: 24, height: 3, borderRadius: 2, backgroundColor: theme.primary }} />
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="ajeeb"
          options={{
            title: '🤖 ai',
            headerShown: false,
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
            tabBarIcon: ({ color, focused, size }) => (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="sparkles" size={size} color={color} />
                {focused && (
                  <View style={{ position: 'absolute', bottom: -10, width: 24, height: 3, borderRadius: 2, backgroundColor: theme.primary }} />
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="portfolio-stocks"
          options={{ href: null, title: 'Portfolio Stocks' }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused, size }) => (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="person" size={size} color={color} />
                {focused && (
                  <View style={{ position: 'absolute', bottom: -10, width: 24, height: 3, borderRadius: 2, backgroundColor: theme.primary }} />
                )}
              </View>
            ),
          }}
        />
      </Tabs>
    </>
  );
}

export default function TabLayout() {
  return (
    <ThemeProvider>
      <TabLayoutInner />
    </ThemeProvider>
  );
}
