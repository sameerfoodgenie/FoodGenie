// FoodGenie Design System — "Sunset" Palette
// Deep Royal Purple + Purple + Magenta + Coral + Golden Yellow
// Premium, Energetic, Modern, Food-Tech + AI + Creator Economy

export const theme = {
  // Sunset Palette Core
  sunset: {
    navy: '#1E1456',        // Deep Royal Purple / Navy Purple
    purple: '#7B2FA0',      // Purple — AI, secondary highlights
    magenta: '#C41E7A',     // Magenta / Pink Purple — creator, rewards, energy
    coral: '#F04E50',       // Coral Red — urgency, streaks, hot/trending
    gold: '#F5B731',        // Golden Yellow — main CTA, coins, food highlight
  },

  // Primary — Golden Yellow (main CTA, food colour, coin/token)
  primary: '#F5B731',
  primaryLight: '#FDD85D',
  primaryDark: '#D9A020',

  // Premium — Deep Royal Purple (headers, premium sections, dark luxury)
  premium: '#1E1456',
  premiumLight: '#2D1F6B',
  premiumMid: '#7B2FA0',

  // Accent — Coral + Magenta (sparingly)
  coral: '#F04E50',
  magenta: '#C41E7A',
  purple: '#7B2FA0',

  // Semantic
  success: '#4ADE80',
  warning: '#F5B731',
  error: '#F04E50',

  // Backgrounds — Clean white / warm cream
  background: '#FFFDF8',
  backgroundWhite: '#FFFFFF',
  backgroundSecondary: '#FFF9F0',
  backgroundTertiary: '#FFF3E0',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#5A5A72',
  textMuted: '#9A9AB0',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Borders
  border: '#F0E8DC',
  borderLight: 'rgba(30,20,86,0.08)',
  borderGold: 'rgba(245,183,49,0.30)',
  borderPurple: 'rgba(123,47,160,0.20)',

  // Glass
  glass: {
    bg: 'rgba(255,255,255,0.92)',
    bgLight: 'rgba(255,253,248,0.85)',
    border: 'rgba(240,232,220,0.60)',
    borderGold: 'rgba(245,183,49,0.25)',
  },

  // Gradients — Sunset palette combinations
  gradients: {
    // Main Sunset hero gradient
    sunset: ['#1E1456', '#7B2FA0', '#C41E7A', '#F04E50', '#F5B731'],
    sunsetShort: ['#1E1456', '#C41E7A', '#F5B731'],
    sunsetWarm: ['#7B2FA0', '#F04E50', '#F5B731'],

    // Gold-focused
    gold: ['#F5B731', '#FDD85D'],
    goldReverse: ['#FDD85D', '#F5B731'],
    goldDeep: ['#D9A020', '#F5B731'],
    goldPremium: ['#F5B731', '#D9A020'],

    // Purple/Premium
    premiumDark: ['#1E1456', '#2D1F6B'],
    premiumPurple: ['#1E1456', '#7B2FA0'],
    premiumGlow: ['#2D1F6B', '#7B2FA0', '#C41E7A'],

    // Feature cards
    featurePrimary: ['#1E1456', '#7B2FA0', '#F04E50'],
    featureSecondary: ['#2D1F6B', '#7B2FA0'],
    featureAI: ['#1E1456', '#7B2FA0'],

    // Coral/Energy
    coral: ['#F04E50', '#FF6B6B'],
    coralGold: ['#F04E50', '#F5B731'],

    // Magenta/Creator
    magenta: ['#C41E7A', '#E84BA5'],
    magentaPurple: ['#7B2FA0', '#C41E7A'],

    // Utility
    background: ['#FFFDF8', '#FFFFFF'],
    card: ['#FFFFFF', '#FFFDF8'],
    cardGlass: ['rgba(255,255,255,0.95)', 'rgba(255,253,248,0.90)'],
    darkOverlay: ['transparent', 'rgba(30,20,86,0.75)'],
    heroOverlay: ['rgba(0,0,0,0.0)', 'rgba(30,20,86,0.20)', 'rgba(30,20,86,0.55)', 'rgba(30,20,86,0.80)'],

    // Legacy compat
    accent: ['#F5B731', '#D9A020'],
    trust: ['#1E1456', '#7B2FA0'],
    vibrant: ['#7B2FA0', '#F04E50', '#F5B731'],
    premium: ['#1E1456', '#7B2FA0'],
    cameraBtn: ['#F5B731', '#FDD85D'],
    glass: ['rgba(255,253,248,0.95)', 'rgba(255,255,255,0.98)'],
  },

  // Shadows
  shadows: {
    card: {
      shadowColor: '#1E1456',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    cardElevated: {
      shadowColor: '#1E1456',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 20,
      elevation: 6,
    },
    goldGlow: {
      shadowColor: '#F5B731',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.22,
      shadowRadius: 16,
      elevation: 6,
    },
    purpleGlow: {
      shadowColor: '#7B2FA0',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      elevation: 5,
    },
    heavy: {
      shadowColor: '#1E1456',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 10,
    },
    colored: {
      shadowColor: '#F5B731',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.14,
      shadowRadius: 10,
      elevation: 4,
    },
    subtle: {
      shadowColor: '#1E1456',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    genie: {
      shadowColor: '#7B2FA0',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
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
