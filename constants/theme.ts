// FoodGenie Design System
// Premium Luxury — Black + Gold + Yellow

export const theme = {
  // Primary - Rich Gold
  primary: '#D4AF37',
  primaryLight: '#FFD700',
  primaryDark: '#B8960C',

  // Accent - Warm Yellow
  accent: '#FFC107',
  accentLight: '#FFE082',
  accentDark: '#FFA000',

  // Trust Colors
  success: '#4ADE80',
  warning: '#FFC107',
  error: '#FF3B30',

  // Backgrounds - Deep black luxury
  background: '#0A0A0A',
  backgroundSecondary: '#121212',
  backgroundTertiary: '#1A1A1A',
  surface: '#151515',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#6B6B6B',
  textOnPrimary: '#0A0A0A',

  // Borders
  border: 'rgba(212,175,55,0.10)',
  borderLight: 'rgba(255,255,255,0.05)',

  // Gradients
  gradients: {
    gold: ['#D4AF37', '#FFD700'],
    goldReverse: ['#FFD700', '#D4AF37'],
    goldShine: ['#FFE082', '#FFD700', '#D4AF37', '#B8960C'],
    goldSubtle: ['rgba(212,175,55,0.12)', 'rgba(212,175,55,0.04)'],
    accent: ['#FFC107', '#FFA000'],
    trust: ['#D4AF37', '#B8960C'],
    background: ['#0A0A0A', '#121212'],
    vibrant: ['#FFD700', '#D4AF37', '#B8960C'],
    sunset: ['#FF3B30', '#FF6B3A', '#FFC107'],
    card: ['rgba(21,21,21,0.95)', 'rgba(21,21,21,0.98)'],
    premium: ['#121212', '#1A1A1A'],
    glass: ['rgba(212,175,55,0.06)', 'rgba(255,255,255,0.02)'],
    cameraBtn: ['#D4AF37', '#FFD700'],
    darkOverlay: ['transparent', 'rgba(0,0,0,0.85)'],
    // Legacy compat
    genie: ['#D4AF37', '#FFD700', '#B8960C'],
    genieReverse: ['#B8960C', '#FFD700', '#D4AF37'],
  },

  // Shadows
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 4,
    },
    cardElevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 8,
    },
    goldGlow: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 10,
    },
    heavy: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.6,
      shadowRadius: 32,
      elevation: 14,
    },
    colored: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 5,
    },
    neonGold: {
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
    },
    // Legacy compat
    genie: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    neonGreen: {
      shadowColor: '#D4AF37',
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
