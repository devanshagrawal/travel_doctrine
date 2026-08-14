// Editorial "travel-magazine" palettes — warm, elegant, gold/terracotta accents.
// Two full palettes (light ivory + dark charcoal) sharing the same keys so a
// component can swap the whole look by switching which object it reads.

export interface Palette {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;

  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;

  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  white: string;

  cat: string[];
}

// Warm category palette (shared, reads well on both themes).
const CAT = ['#C15F3C', '#C79A4B', '#5B8266', '#5E7A99', '#8C5B7A', '#A9743F', '#6E7F4E', '#3F8C86'];

export const lightColors: Palette = {
  primary: '#C15F3C', // terracotta
  primaryDark: '#A44E30',
  primarySoft: '#F6E7DF',
  accent: '#B98C3E', // antique gold
  accentSoft: '#F4ECD8',

  success: '#4F7A5B',
  successSoft: '#E7EFE8',
  warning: '#B5772E',
  warningSoft: '#F6ECDA',
  danger: '#A5432F',
  dangerSoft: '#F3E2DD',

  bg: '#FBF7F0', // warm ivory
  surface: '#FFFFFF',
  surfaceAlt: '#F3EBDE', // warm sand
  border: '#E8DECD',
  text: '#241F18', // warm near-black
  textMuted: '#78705F',
  textFaint: '#A79C87',
  white: '#FFFFFF',

  cat: CAT,
};

export const darkColors: Palette = {
  primary: '#D9805F', // warm terracotta, lifted for dark
  primaryDark: '#C06A4C',
  primarySoft: '#3A241C',
  accent: '#D7B160', // gold
  accentSoft: '#332A18',

  success: '#82B08D',
  successSoft: '#213024',
  warning: '#D8A552',
  warningSoft: '#33291A',
  danger: '#DB7A65',
  dangerSoft: '#361F1B',

  bg: '#15120D', // warm near-black
  surface: '#201B14',
  surfaceAlt: '#2B251C',
  border: '#3A3227',
  text: '#F4EEE2',
  textMuted: '#B4A994',
  textFaint: '#867C6B',
  white: '#FFFFFF',

  cat: CAT,
};
