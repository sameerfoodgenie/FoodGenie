// FoodGenie Design System
// Premium Black & Gold theme (luxury, trust-focused)

export const theme = {
  // Primary - Gold (premium, genie magic)
  primary: '#F59E0B',
  primaryLight: '#FBBF24',
  primaryDark: '#D97706',
  
  // Accent - Deep Gold
  accent: '#EAB308',
  accentLight: '#FDE047',
  accentDark: '#CA8A04',
  
  // Trust Colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Backgrounds - Dark theme
  background: '#0A0A0A',
  backgroundSecondary: '#141414',
  backgroundTertiary: '#1F1F1F',
  surface: '#1A1A1A',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textOnPrimary: '#0A0A0A',
  
  // Borders
  border: '#27272A',
  borderLight: '#3F3F46',
  
  // Gradients
  gradients: {
    genie: ['#F59E0B', '#EAB308', '#CA8A04'],
    genieReverse: ['#CA8A04', '#EAB308', '#F59E0B'],
    gold: ['#FDE047', '#FBBF24', '#F59E0B'],
    accent: ['#FBBF24', '#F59E0B'],
    trust: ['#22C55E', '#16A34A'],
    background: ['#141414', '#0A0A0A'],
    vibrant: ['#F59E0B', '#EAB308', '#FDE047'],
    sunset: ['#F59E0B', '#FB923C', '#FBBF24'],
    card: ['rgba(26,26,26,0.95)', 'rgba(26,26,26,0.98)'],
    premium: ['#1F1F1F', '#0A0A0A'],
    goldShine: ['#FDE047', '#FBBF24', '#F59E0B', '#D97706'],
  },
  
  // Shadows - Gold tinted
  shadows: {
    card: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    cardElevated: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    genie: {
      shadowColor: '#FBBF24',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.5,
      shadowRadius: 32,
      elevation: 16,
    },
    heavy: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.6,
      shadowRadius: 36,
      elevation: 20,
    },
    colored: {
      shadowColor: '#FBBF24',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 6,
    },
    goldGlow: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 40,
      elevation: 20,
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border Radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  // Typography (Content Feed archetype)
  typography: {
    hero: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    title: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
    micro: {
      fontSize: 11,
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
  },
};

export default theme;
