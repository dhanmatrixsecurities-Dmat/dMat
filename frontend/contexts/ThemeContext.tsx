import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'dhanmatrix_dark_mode';

export interface AppTheme {
  isDark: boolean;
  toggleTheme: () => void;
  // Backgrounds
  background:     string;
  cardBackground: string;
  headerBg:       string;
  quotesBg:       string;
  quotesText:     string;
  // Text
  text:           string;
  textSecondary:  string;
  // Borders / dividers
  border:         string;
  divider:        string;
  // Brand
  primary:        string;
  accent:         string;
  // Semantic
  success:        string;
  warning:        string;
  error:          string;
  // Tab bar
  tabActiveBg:    string;
  tabActiveTint:  string;
  tabInactiveTint:string;
  tabBarBg:       string;
}

const light: AppTheme = {
  isDark:          false,
  toggleTheme:     () => {},
  background:      '#eef1f6',
  cardBackground:  '#ffffff',
  headerBg:        '#0d1b3e',
  quotesBg:        '#1e3a5f',
  quotesText:      '#c8deff',
  text:            '#1a1a2e',
  textSecondary:   '#6b7280',
  border:          '#e5e7eb',
  divider:         '#f0f2f8',
  primary:         '#001F3F',
  accent:          '#4ecfa8',
  success:         '#22a85a',
  warning:         '#f59e0b',
  error:           '#e03030',
  tabActiveBg:     '#001F3F',
  tabActiveTint:   '#ffffff',
  tabInactiveTint: '#6b7280',
  tabBarBg:        '#ffffff',
};

const dark: AppTheme = {
  isDark:          true,
  toggleTheme:     () => {},
  background:      '#060f1e',
  cardBackground:  '#0d1f3c',
  headerBg:        '#020a14',
  quotesBg:        '#0a1a30',
  quotesText:      '#a0c4ff',
  text:            '#e0e8f5',
  textSecondary:   '#8aa5c8',
  border:          '#1a3460',
  divider:         '#1a3460',
  primary:         '#3b7ef8',
  accent:          '#4ecfa8',
  success:         '#22c55e',
  warning:         '#f59e0b',
  error:           '#ef4444',
  tabActiveBg:     '#3b7ef8',
  tabActiveTint:   '#ffffff',
  tabInactiveTint: '#8aa5c8',
  tabBarBg:        '#0d1f3c',
};

const ThemeContext = createContext<AppTheme>(light);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'true') setIsDark(true);
      } catch {}
    })();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try { await AsyncStorage.setItem(THEME_KEY, String(next)); } catch {}
  };

  const theme: AppTheme = {
    ...(isDark ? dark : light),
    isDark,
    toggleTheme,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
