import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Inner layout — uses theme from ThemeProvider above it
function TabLayoutInner() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style="light" backgroundColor={theme.headerBg} />
      <Tabs
        initialRouteName="index"
        screenOptions={{
          // Option D — active tab gets navy/blue block, white icons + label
          tabBarActiveTintColor:       theme.tabActiveTint,
          tabBarInactiveTintColor:     theme.tabInactiveTint,
          tabBarActiveBackgroundColor: theme.tabActiveBg,
          tabBarStyle: {
            backgroundColor: theme.tabBarBg,
            borderTopWidth: 1,
            borderTopColor: theme.border,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          // Block shape per tab item
          tabBarItemStyle: {
            flex: 1,
            borderRadius: 10,
            margin: 3,
          },
          // Kill the v7 pill indicator
          tabBarActiveIndicatorStyle: { backgroundColor: 'transparent', height: 0 },
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
        <Tabs.Screen
          name="portfolio-stocks"
          options={{ href: null, title: 'Portfolio Stocks' }}
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

// Wrap with ThemeProvider — all tab screens get the theme context
export default function TabLayout() {
  return (
    <ThemeProvider>
      <TabLayoutInner />
    </ThemeProvider>
  );
}
