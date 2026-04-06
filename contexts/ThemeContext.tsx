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
  // Brand (unchanged)
  primary: string;
  primaryLight: string;
  gold: string;
  success: string;
  error: string;
  warning: string;
}

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  backgroundSecondary: '#F8F8FA',
  backgroundTertiary: '#F1F1F5',
  surface: '#F4F4F8',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: 'rgba(0,0,0,0.06)',
  borderLight: 'rgba(0,0,0,0.04)',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.06)',
  inputBg: '#F4F4F8',
  inputBorder: 'rgba(0,0,0,0.06)',
  overlayBg: 'rgba(0,0,0,0.45)',
  modalBg: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  tabBarBorder: 'rgba(0,0,0,0.06)',
  statusBarStyle: 'dark',
  shimmerBase: '#E5E7EB',
  shimmerHighlight: '#F3F4F6',
  primary: '#D4AF37',
  primaryLight: '#FFD700',
  gold: '#D4AF37',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
};

export const darkColors: ThemeColors = {
  background: '#0A0A0F',
  backgroundSecondary: '#14141C',
  backgroundTertiary: '#1A1A26',
  surface: '#1A1A26',
  surfaceElevated: '#20202E',
  textPrimary: '#F0F0F5',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',
  cardBg: '#14141C',
  cardBorder: 'rgba(255,255,255,0.08)',
  inputBg: '#1A1A26',
  inputBorder: 'rgba(255,255,255,0.10)',
  overlayBg: 'rgba(0,0,0,0.65)',
  modalBg: '#14141C',
  tabBarBg: '#0A0A0F',
  tabBarBorder: 'rgba(255,255,255,0.06)',
  statusBarStyle: 'light',
  shimmerBase: '#1A1A26',
  shimmerHighlight: '#2A2A3A',
  primary: '#D4AF37',
  primaryLight: '#FFD700',
  gold: '#D4AF37',
  success: '#4ADE80',
  error: '#FF6B6B',
  warning: '#FFB347',
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
