// FoodGenie Design System
// Dark premium, camera-first, Gen-Z inspired

export const theme = {
  // Primary - Vibrant Green (health/freshness)
  primary: '#4ADE80',
  primaryLight: '#86EFAC',
  primaryDark: '#22C55E',

  // Accent - Warm Gold (scores, streaks)
  accent: '#FBBF24',
  accentLight: '#FDE68A',
  accentDark: '#F59E0B',

  // Trust Colors
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',

  // Backgrounds - Deep dark
  background: '#0A0A0F',
  backgroundSecondary: '#141419',
  backgroundTertiary: '#1E1E26',
  surface: '#1A1A22',

  // Text
  textPrimary: '#F5F5F7',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textOnPrimary: '#0A0A0F',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',

  // Gradients
  gradients: {
    genie: ['#4ADE80', '#22C55E', '#16A34A'],
    genieReverse: ['#16A34A', '#22C55E', '#4ADE80'],
    gold: ['#FDE68A', '#FBBF24', '#F59E0B'],
    accent: ['#FBBF24', '#F59E0B'],
    trust: ['#4ADE80', '#22C55E'],
    background: ['#0A0A0F', '#141419'],
    vibrant: ['#4ADE80', '#22C55E', '#86EFAC'],
    sunset: ['#F87171', '#FB923C', '#FBBF24'],
    card: ['rgba(26,26,34,0.95)', 'rgba(26,26,34,0.98)'],
    premium: ['#141419', '#1A1A22'],
    goldShine: ['#FDE68A', '#FBBF24', '#F59E0B', '#D97706'],
    glass: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'],
    cameraBtn: ['#4ADE80', '#22C55E'],
  },

  // Shadows
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 3,
    },
    cardElevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 6,
    },
    genie: {
      shadowColor: '#4ADE80',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    heavy: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.5,
      shadowRadius: 32,
      elevation: 14,
    },
    colored: {
      shadowColor: '#4ADE80',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 14,
      elevation: 5,
    },
    goldGlow: {
      shadowColor: '#FBBF24',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 12,
    },
    neonGreen: {
      shadowColor: '#4ADE80',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 8,
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

  // Typography
  typography: {
    hero: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
    title: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
    subtitle: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    bodyBold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
    caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    small: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
    micro: { fontSize: 11, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  },
};

export default theme;
