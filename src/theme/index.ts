// Central design tokens. Colours live in ./palettes (editorial light + dark);
// this module re-exports the light palette as the default `colors` (used by
// screens not yet converted to the dynamic theme) plus the shared scales.
import { lightColors } from './palettes';

export { lightColors, darkColors } from './palettes';
export type { Palette } from './palettes';

export const colors = lightColors;

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

// Display face = Fraunces (editorial serif, loaded in the root layout).
// Body/UI stays on the platform system font.
export const fonts = {
  serif: 'Fraunces_600SemiBold',
  serifMedium: 'Fraunces_500Medium',
  serifRegular: 'Fraunces_400Regular',
  serifItalic: 'Fraunces_500Medium_Italic',
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
    shadowColor: '#2A1E12',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#2A1E12',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;
