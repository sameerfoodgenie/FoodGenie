import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@foodgenie_dark_mode';

export interface ThemeColors {
  // Core
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceElevated: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Borders
  border: string;
  borderLight: string;
  // Cards
  cardBg: string;
  cardBorder: string;
  // Input
  inputBg: string;
  inputBorder: string;
  // Overlay
  overlayBg: string;
  modalBg: string;
  // Tab bar
  tabBarBg: string;
  tabBarBorder: string;
  // Status bar
  statusBarStyle: 'dark' | 'light';
  // Misc
  shimmerBase: string;
  shimmerHighlight: string;
  // Brand - Sunset palette
  primary: string;
  primaryLight: string;
  gold: string;
  premium: string;
  purple: string;
  magenta: string;
  coral: string;
  success: string;
  error: string;
  warning: string;
}

export const lightColors: ThemeColors = {
  background: '#FFFDF8',
  backgroundSecondary: '#FFF9F0',
  backgroundTertiary: '#FFF3E0',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#5A5A72',
  textMuted: '#9A9AB0',
  border: '#F0E8DC',
  borderLight: 'rgba(30,20,86,0.06)',
  cardBg: '#FFFFFF',
  cardBorder: '#F0E8DC',
  inputBg: '#FFFDF8',
  inputBorder: '#F0E8DC',
  overlayBg: 'rgba(30,20,86,0.45)',
  modalBg: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#F0E8DC',
  statusBarStyle: 'dark',
  shimmerBase: '#FFF3E0',
  shimmerHighlight: '#FFFDF8',
  primary: '#F5B731',
  primaryLight: '#FDD85D',
  gold: '#F5B731',
  premium: '#1E1456',
  purple: '#7B2FA0',
  magenta: '#C41E7A',
  coral: '#F04E50',
  success: '#4ADE80',
  error: '#F04E50',
  warning: '#F5B731',
};

export const darkColors: ThemeColors = {
  background: '#0D0A1A',
  backgroundSecondary: '#151030',
  backgroundTertiary: '#1E1456',
  surface: '#151030',
  surfaceElevated: '#1E1456',
  textPrimary: '#FFFDF8',
  textSecondary: '#BFB7D4',
  textMuted: '#7A728E',
  border: 'rgba(123,47,160,0.20)',
  borderLight: 'rgba(123,47,160,0.10)',
  cardBg: '#151030',
  cardBorder: 'rgba(123,47,160,0.25)',
  inputBg: '#151030',
  inputBorder: 'rgba(123,47,160,0.25)',
  overlayBg: 'rgba(0,0,0,0.65)',
  modalBg: '#151030',
  tabBarBg: '#0D0A1A',
  tabBarBorder: 'rgba(123,47,160,0.15)',
  statusBarStyle: 'light',
  shimmerBase: '#151030',
  shimmerHighlight: '#1E1456',
  primary: '#F5B731',
  primaryLight: '#FDD85D',
  gold: '#F5B731',
  premium: '#1E1456',
  purple: '#7B2FA0',
  magenta: '#C41E7A',
  coral: '#F04E50',
  success: '#4ADE80',
  error: '#F04E50',
  warning: '#F5B731',
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggleDarkMode: () => {},
  setDarkMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(val => {
      if (val === 'true') setIsDark(true);
    }).catch(() => {});
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const setDarkMode = useCallback((value: boolean) => {
    setIsDark(value);
    AsyncStorage.setItem(THEME_KEY, String(value)).catch(() => {});
  }, []);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
