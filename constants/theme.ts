// FoodGenie Design System
// Premium Luxury — Black + Gold + Yellow — Refined Glass Metaphor

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
  background: '#0A0A0F',
  backgroundSecondary: '#111116',
  backgroundTertiary: '#18181E',
  surface: '#1A1A22',
  surfaceElevated: '#22222C',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textOnPrimary: '#0A0A0F',

  // Borders
  border: 'rgba(212,175,55,0.08)',
  borderLight: 'rgba(255,255,255,0.04)',
  borderGold: 'rgba(212,175,55,0.18)',

  // Glass
  glass: {
    bg: 'rgba(26,26,34,0.75)',
    bgLight: 'rgba(34,34,44,0.60)',
    border: 'rgba(255,255,255,0.08)',
    borderGold: 'rgba(212,175,55,0.12)',
  },

  // Gradients
  gradients: {
    gold: ['#D4AF37', '#FFD700'],
    goldReverse: ['#FFD700', '#D4AF37'],
    goldShine: ['#FFE082', '#FFD700', '#D4AF37', '#B8960C'],
    goldSubtle: ['rgba(212,175,55,0.12)', 'rgba(212,175,55,0.03)'],
    goldVibrant: ['#FFD700', '#D4AF37', '#C49B2C'],
    accent: ['#FFC107', '#FFA000'],
    trust: ['#D4AF37', '#B8960C'],
    background: ['#0A0A0F', '#111116'],
    vibrant: ['#FFD700', '#D4AF37', '#B8960C'],
    sunset: ['#FF3B30', '#FF6B3A', '#FFC107'],
    card: ['rgba(26,26,34,0.95)', 'rgba(26,26,34,0.98)'],
    cardGlass: ['rgba(34,34,44,0.50)', 'rgba(26,26,34,0.80)'],
    premium: ['#111116', '#18181E'],
    glass: ['rgba(212,175,55,0.06)', 'rgba(255,255,255,0.02)'],
    cameraBtn: ['#D4AF37', '#FFD700'],
    darkOverlay: ['transparent', 'rgba(10,10,15,0.90)'],
    heroOverlay: ['rgba(10,10,15,0.0)', 'rgba(10,10,15,0.4)', 'rgba(10,10,15,0.85)', 'rgba(10,10,15,0.98)'],
    // Legacy compat
    genie: ['#D4AF37', '#FFD700', '#B8960C'],
    genieReverse: ['#B8960C', '#FFD700', '#D4AF37'],
  },

  // Shadows
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 6,
    },
    cardElevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.55,
      shadowRadius: 24,
      elevation: 10,
    },
    goldGlow: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.40,
      shadowRadius: 20,
      elevation: 12,
    },
    heavy: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.65,
      shadowRadius: 40,
      elevation: 16,
    },
    colored: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 14,
      elevation: 6,
    },
    neonGold: {
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 24,
      elevation: 10,
    },
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
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
    xxl: 28,
    full: 9999,
  },

  // Typography
  typography: {
    hero: { fontSize: 34, fontWeight: '800' as const, lineHeight: 42, letterSpacing: -0.5 },
    title: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
    subtitle: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    bodyBold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
    caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    small: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
    micro: { fontSize: 11, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  },
};

export default theme;
