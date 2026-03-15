// FoodGenie Design System
// Soft, warm, inviting theme (cafe-style, approachable)

export const theme = {
  // Primary - Warm Caramel / Amber
  primary: '#C8875A',
  primaryLight: '#DCAB82',
  primaryDark: '#A86F42',

  // Accent - Warm Terracotta
  accent: '#D4915E',
  accentLight: '#E8C4A0',
  accentDark: '#B07540',

  // Trust Colors
  success: '#5DAE7E',
  warning: '#D4A055',
  error: '#D17272',

  // Backgrounds - Soft warm light theme
  background: '#FAF7F3',
  backgroundSecondary: '#F2EDE7',
  backgroundTertiary: '#E8E2DA',
  surface: '#FFFFFF',

  // Text
  textPrimary: '#2C2520',
  textSecondary: '#7A706A',
  textMuted: '#A89E96',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#E4DED6',
  borderLight: '#D6CFC6',

  // Gradients
  gradients: {
    genie: ['#D4915E', '#C8875A', '#A86F42'],
    genieReverse: ['#A86F42', '#C8875A', '#D4915E'],
    gold: ['#E8C4A0', '#DCAB82', '#C8875A'],
    accent: ['#DCAB82', '#C8875A'],
    trust: ['#5DAE7E', '#4A9568'],
    background: ['#F2EDE7', '#FAF7F3'],
    vibrant: ['#D4915E', '#C8875A', '#E8C4A0'],
    sunset: ['#D4915E', '#E0976A', '#DCAB82'],
    card: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)'],
    premium: ['#F2EDE7', '#FAF7F3'],
    goldShine: ['#E8C4A0', '#DCAB82', '#C8875A', '#A86F42'],
  },

  // Shadows - Soft warm tint
  shadows: {
    card: {
      shadowColor: '#B09080',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    cardElevated: {
      shadowColor: '#B09080',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 6,
    },
    genie: {
      shadowColor: '#C8875A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 28,
      elevation: 10,
    },
    heavy: {
      shadowColor: '#C8875A',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.25,
      shadowRadius: 32,
      elevation: 14,
    },
    colored: {
      shadowColor: '#C8875A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 14,
      elevation: 5,
    },
    goldGlow: {
      shadowColor: '#C8875A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 30,
      elevation: 12,
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
