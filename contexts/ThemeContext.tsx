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
  // Brand
  primary: string;
  primaryLight: string;
  gold: string;
  success: string;
  error: string;
  warning: string;
}

export const lightColors: ThemeColors = {
  background: '#FFF9E8',
  backgroundSecondary: '#FFFDF5',
  backgroundTertiary: '#FFF5D6',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#171717',
  textSecondary: '#7A7A7A',
  textMuted: '#A3A3A3',
  border: '#E8D28A',
  borderLight: 'rgba(212,175,55,0.15)',
  cardBg: '#FFFFFF',
  cardBorder: '#E8D28A',
  inputBg: '#FFFDF5',
  inputBorder: '#E8D28A',
  overlayBg: 'rgba(23,23,23,0.45)',
  modalBg: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E8D28A',
  statusBarStyle: 'dark',
  shimmerBase: '#FFF5D6',
  shimmerHighlight: '#FFFDF5',
  primary: '#D4AF37',
  primaryLight: '#F6C945',
  gold: '#D4AF37',
  success: '#B8860B',
  error: '#C45C3A',
  warning: '#D4AF37',
};

export const darkColors: ThemeColors = {
  background: '#0F0D08',
  backgroundSecondary: '#1A1609',
  backgroundTertiary: '#231E0F',
  surface: '#1A1609',
  surfaceElevated: '#231E0F',
  textPrimary: '#FFF9E8',
  textSecondary: '#BFB79A',
  textMuted: '#8A7F64',
  border: 'rgba(212,175,55,0.18)',
  borderLight: 'rgba(212,175,55,0.10)',
  cardBg: '#1A1609',
  cardBorder: 'rgba(212,175,55,0.20)',
  inputBg: '#1A1609',
  inputBorder: 'rgba(212,175,55,0.20)',
  overlayBg: 'rgba(0,0,0,0.65)',
  modalBg: '#1A1609',
  tabBarBg: '#0F0D08',
  tabBarBorder: 'rgba(212,175,55,0.12)',
  statusBarStyle: 'light',
  shimmerBase: '#1A1609',
  shimmerHighlight: '#2A2310',
  primary: '#D4AF37',
  primaryLight: '#F6C945',
  gold: '#D4AF37',
  success: '#D4AF37',
  error: '#E87C5A',
  warning: '#F6C945',
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
