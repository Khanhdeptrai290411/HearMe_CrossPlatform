import { Platform } from 'react-native';

// ─── Expo Router compatibility (keep Colors export) ──────────────────────────
export const Colors = {
  light: {
    text: '#111111',
    background: '#FFF7E8',
    tint: '#5B5EF7',
    icon: '#888888',
    tabIconDefault: '#888888',
    tabIconSelected: '#5B5EF7',
  },
  dark: {
    text: '#111111',
    background: '#FFF7E8',
    tint: '#5B5EF7',
    icon: '#888888',
    tabIconDefault: '#888888',
    tabIconSelected: '#5B5EF7',
  },
};

// ─── Neo Brutalism Design System ─────────────────────────────────────────────
export const NB = {
  // Core Colors
  color: {
    bg: '#FFF7E8',          // cream page background
    surface: '#FFFFFF',     // card/surface white
    text: '#111111',        // main text black
    primary: '#5B5EF7',     // primary action indigo
    primaryText: '#FFFFFF', // text on primary buttons
    secondary: '#FFB703',   // highlight / badge amber
    accent: '#00C2A8',      // success / accent teal
    danger: '#FF4D6D',      // error / danger pink-red
    border: '#111111',      // universal border black
    muted: '#888888',       // muted text
    mutedBg: '#F0EDE6',     // muted / disabled background
    // Light tints for backgrounds
    primaryLight: '#EBEBFF', // light indigo bg
    secondaryLight: '#FFF3CC', // light amber bg
    accentLight: '#D4FAF5',  // light teal bg
    dangerLight: '#FFE0E6',  // light danger bg
  },

  // Border widths
  border: {
    thin: 1.5,
    regular: 2.5,
    thick: 3.5,
  },

  // Border radius (neo brutalism uses minimal radius)
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },

  // Spacing
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    section: 56,
  },

  // Offset hard shadows (the core of neo brutalism)
  shadow: {
    // Platform-adaptive hard offset shadows
    sm: Platform.OS === 'web'
      ? { boxShadow: '3px 3px 0px #111111' }
      : { shadowColor: '#111111', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
    md: Platform.OS === 'web'
      ? { boxShadow: '5px 5px 0px #111111' }
      : { shadowColor: '#111111', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 },
    lg: Platform.OS === 'web'
      ? { boxShadow: '7px 7px 0px #111111' }
      : { shadowColor: '#111111', shadowOffset: { width: 7, height: 7 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 },
    // Hover state — web only
    hover: Platform.OS === 'web'
      ? { boxShadow: '8px 8px 0px #111111' }
      : {},
    // Color shadows
    primary: Platform.OS === 'web'
      ? { boxShadow: '5px 5px 0px #111111' }
      : { shadowColor: '#111111', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 },
    secondary: Platform.OS === 'web'
      ? { boxShadow: '4px 4px 0px #111111' }
      : { shadowColor: '#111111', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 },
    none: Platform.OS === 'web'
      ? { boxShadow: 'none' }
      : { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  },

  // Typography
  text: {
    display: { fontSize: 42, fontWeight: '900' as const, color: '#111111', lineHeight: 48, letterSpacing: -1 },
    h1: { fontSize: 34, fontWeight: '900' as const, color: '#111111', lineHeight: 40, letterSpacing: -0.5 },
    h2: { fontSize: 26, fontWeight: '800' as const, color: '#111111', lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '800' as const, color: '#111111', lineHeight: 26 },
    h4: { fontSize: 16, fontWeight: '700' as const, color: '#111111' },
    body: { fontSize: 15, fontWeight: '500' as const, color: '#111111', lineHeight: 22 },
    bodyLg: { fontSize: 17, fontWeight: '500' as const, color: '#111111', lineHeight: 26 },
    bodySm: { fontSize: 13, fontWeight: '500' as const, color: '#555555', lineHeight: 18 },
    label: { fontSize: 13, fontWeight: '700' as const, color: '#111111', letterSpacing: 0.3 },
    caption: { fontSize: 11, fontWeight: '700' as const, color: '#888888', letterSpacing: 0.5, textTransform: 'uppercase' as const },
    mono: { fontSize: 14, fontWeight: '700' as const, color: '#111111', fontFamily: 'monospace' },
  },

  // Transition strings (web only)
  transition: {
    fast: 'all 0.12s ease',
    base: 'all 0.18s ease',
    slow: 'all 0.28s ease',
    shadow: 'box-shadow 0.12s ease, transform 0.12s ease',
  },
} as const;

// Keep DS as alias for backward compatibility during migration
export const DS = {
  color: {
    primary: NB.color.primary,
    primaryDark: '#3D40C4',
    primaryLight: NB.color.primaryLight,
    primaryMid: '#AAAEF9',
    success: NB.color.accent,
    successLight: NB.color.accentLight,
    warning: NB.color.secondary,
    warningLight: NB.color.secondaryLight,
    danger: NB.color.danger,
    dangerLight: NB.color.dangerLight,
    bg: NB.color.bg,
    surface: NB.color.surface,
    textMain: NB.color.text,
    textSecondary: NB.color.muted,
    textMuted: NB.color.muted,
    border: NB.color.border,
    borderFocus: NB.color.primary,
  },
  radius: NB.radius,
  space: NB.space,
  shadow: {
    sm: NB.shadow.sm,
    md: NB.shadow.md,
    lg: NB.shadow.lg,
    primary: NB.shadow.primary,
  },
  text: NB.text,
  gradient: {
    hero: 'none',
    card: 'none',
    primary: 'none',
  },
};

// Font families
export const Fonts = Platform.select({
  ios: { sans: '-apple-system, BlinkMacSystemFont', mono: 'Courier New' },
  default: { sans: 'normal', mono: 'monospace' },
  web: {
    sans: "'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif",
    mono: "'Space Mono', 'Courier New', monospace",
  },
});
