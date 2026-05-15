// FoodGenie Design System
// Clean White + Gold Accent — Light, Modern, Warm

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
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',

  // Backgrounds - Clean white
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#F1F3F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: 'rgba(0,0,0,0.06)',
  borderLight: 'rgba(0,0,0,0.04)',
  borderGold: 'rgba(212,175,55,0.22)',

  // Glass
  glass: {
    bg: 'rgba(255,255,255,0.85)',
    bgLight: 'rgba(255,255,255,0.70)',
    border: 'rgba(0,0,0,0.06)',
    borderGold: 'rgba(212,175,55,0.18)',
  },

  // Gradients
  gradients: {
    gold: ['#D4AF37', '#FFD700'],
    goldReverse: ['#FFD700', '#D4AF37'],
    goldShine: ['#FFE082', '#FFD700', '#D4AF37', '#B8960C'],
    goldSubtle: ['rgba(212,175,55,0.08)', 'rgba(212,175,55,0.02)'],
    goldVibrant: ['#FFD700', '#D4AF37', '#C49B2C'],
    accent: ['#FFC107', '#FFA000'],
    trust: ['#D4AF37', '#B8960C'],
    background: ['#FFFFFF', '#F8F8FA'],
    vibrant: ['#FFD700', '#D4AF37', '#B8960C'],
    sunset: ['#FF3B30', '#FF6B3A', '#FFC107'],
    card: ['#FFFFFF', '#FAFAFA'],
    cardGlass: ['rgba(255,255,255,0.90)', 'rgba(248,248,250,0.95)'],
    premium: ['#FFFFFF', '#F8F8FA'],
    glass: ['rgba(212,175,55,0.04)', 'rgba(255,255,255,0.95)'],
    cameraBtn: ['#D4AF37', '#FFD700'],
    darkOverlay: ['transparent', 'rgba(0,0,0,0.70)'],
    heroOverlay: ['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.85)'],
    // Legacy compat
    genie: ['#D4AF37', '#FFD700', '#B8960C'],
    genieReverse: ['#B8960C', '#FFD700', '#D4AF37'],
  },

  // Shadows
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    cardElevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 20,
      elevation: 6,
    },
    goldGlow: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.20,
      shadowRadius: 16,
      elevation: 6,
    },
    heavy: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 10,
    },
    colored: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 4,
    },
    neonGold: {
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 6,
    },
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    // Legacy compat
    genie: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
    neonGreen: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      elevation: 5,
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
