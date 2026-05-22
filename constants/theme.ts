// FoodGenie Design System
// Premium Luxury Gold + White/Warm Cream — Clean, Minimal, Food-Focused

export const theme = {
  // Primary - Luxury Gold Family
  primary: '#D4AF37',
  primaryLight: '#F6C945',
  primaryDark: '#B8860B',

  // Accent - Warm Gold tones
  accent: '#E8D28A',
  accentLight: '#FFF3C4',
  accentDark: '#B8860B',

  // Semantic (muted, gold-tinted)
  success: '#B8860B',
  warning: '#D4AF37',
  error: '#C45C3A',

  // Backgrounds - Warm Cream + White
  background: '#FFF9E8',
  backgroundWhite: '#FFFFFF',
  backgroundSecondary: '#FFFDF5',
  backgroundTertiary: '#FFF5D6',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#171717',
  textSecondary: '#7A7A7A',
  textMuted: '#A3A3A3',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#E8D28A',
  borderLight: 'rgba(212,175,55,0.15)',
  borderGold: 'rgba(212,175,55,0.30)',

  // Glass
  glass: {
    bg: 'rgba(255,255,255,0.92)',
    bgLight: 'rgba(255,249,232,0.85)',
    border: 'rgba(232,210,138,0.40)',
    borderGold: 'rgba(212,175,55,0.25)',
  },

  // Gradients - Gold family only
  gradients: {
    gold: ['#D4AF37', '#F6C945'],
    goldReverse: ['#F6C945', '#D4AF37'],
    goldShine: ['#FFF3C4', '#F6C945', '#D4AF37', '#B8860B'],
    goldSubtle: ['rgba(212,175,55,0.08)', 'rgba(246,201,69,0.03)'],
    goldVibrant: ['#F6C945', '#D4AF37', '#B8860B'],
    goldDeep: ['#B8860B', '#D4AF37'],
    goldPremium: ['#D4AF37', '#B8860B'],
    goldLight: ['#FFF9E8', '#FFF3C4'],
    accent: ['#D4AF37', '#B8860B'],
    trust: ['#D4AF37', '#B8860B'],
    background: ['#FFF9E8', '#FFFFFF'],
    vibrant: ['#F6C945', '#D4AF37', '#B8860B'],
    card: ['#FFFFFF', '#FFFDF5'],
    cardGlass: ['rgba(255,255,255,0.95)', 'rgba(255,249,232,0.90)'],
    premium: ['#D4AF37', '#F6C945'],
    glass: ['rgba(255,249,232,0.95)', 'rgba(255,255,255,0.98)'],
    cameraBtn: ['#D4AF37', '#F6C945'],
    darkOverlay: ['transparent', 'rgba(23,23,23,0.70)'],
    heroOverlay: ['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.20)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.80)'],
    // Feature banner - gold only
    featurePrimary: ['#D4AF37', '#F6C945', '#B8860B'],
    featureSecondary: ['#B8860B', '#D4AF37', '#F6C945'],
    // Legacy compat
    genie: ['#D4AF37', '#F6C945', '#B8860B'],
    genieReverse: ['#B8860B', '#F6C945', '#D4AF37'],
    sunset: ['#D4AF37', '#B8860B', '#8B6914'],
  },

  // Shadows
  shadows: {
    card: {
      shadowColor: '#B8860B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    cardElevated: {
      shadowColor: '#B8860B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 20,
      elevation: 6,
    },
    goldGlow: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.22,
      shadowRadius: 16,
      elevation: 6,
    },
    heavy: {
      shadowColor: '#B8860B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 10,
    },
    colored: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.14,
      shadowRadius: 10,
      elevation: 4,
    },
    neonGold: {
      shadowColor: '#F6C945',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.20,
      shadowRadius: 16,
      elevation: 6,
    },
    subtle: {
      shadowColor: '#B8860B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
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
