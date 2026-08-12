// Central design tokens for the whole app.
// Keeping everything here means a single place to restyle the prototype.

export const colors = {
  // Brand
  primary: '#2563EB', // blue-600
  primaryDark: '#1D4ED8',
  primarySoft: '#EFF4FF',
  accent: '#F97316', // orange-500 (travel / sunset)
  accentSoft: '#FFF2E8',

  // Semantic
  success: '#16A34A',
  successSoft: '#E7F6EC',
  warning: '#D97706',
  warningSoft: '#FEF3E2',
  danger: '#DC2626',
  dangerSoft: '#FCECEC',

  // Neutrals
  bg: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F9',
  border: '#E5E8F0',
  text: '#0F172A', // slate-900
  textMuted: '#64748B', // slate-500
  textFaint: '#94A3B8', // slate-400
  white: '#FFFFFF',

  // Category palette (used for budget breakdown)
  cat: ['#2563EB', '#F97316', '#16A34A', '#9333EA', '#0EA5E9', '#E11D48', '#CA8A04', '#0D9488'],
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const font = {
  size: {
    xs: 12,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    display: 32,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;
