import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
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
          // Option E — thin pill at bottom of active tab
          tabBarActiveIndicatorStyle: {
            backgroundColor: theme.primary,
            height: 3,
            borderRadius: 2,
            width: 28,
            bottom: 0,
            position: 'absolute',
          },
          headerStyle:      { backgroundColor: theme.headerBg },
          headerTintColor:  '#ffffff',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
        }}
      >
        <Tabs.Screen name="index"         options={{ title: 'Home',         headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="home"          size={size} color={color} /> }} />
        <Tabs.Screen name="active-trades" options={{ title: 'Active Trades',               tabBarIcon: ({ color, size }) => <Ionicons name="pulse"         size={size} color={color} /> }} />
        <Tabs.Screen name="closed-trades" options={{ title: 'Closed Trades',               tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-done" size={size} color={color} /> }} />
        <Tabs.Screen name="ajeeb"         options={{ title: '🤖 ai',         headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="sparkles"     size={size} color={color} />, tabBarLabelStyle: { fontSize: 10, fontWeight: '600' } }} />
        <Tabs.Screen name="portfolio-stocks" options={{ href: null, title: 'Portfolio Stocks' }} />
        <Tabs.Screen name="profile"       options={{ title: 'Profile',                     tabBarIcon: ({ color, size }) => <Ionicons name="person"        size={size} color={color} /> }} />
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
