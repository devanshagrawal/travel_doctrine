import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { darkColors, lightColors, Palette } from './palettes';
import { fonts, font, radius, shadow, spacing } from './index';

export type ThemeMode = 'light' | 'dark';

interface ThemeStore {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
}

// Persisted manual light/dark switch (not tied to the device setting).
export const useThemeMode = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'light',
      toggle: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
      setMode: (m) => set({ mode: m }),
    }),
    { name: 'wander-theme', storage: createJSONStorage(() => AsyncStorage) }
  )
);

export interface Theme {
  mode: ThemeMode;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  font: typeof font;
  fonts: typeof fonts;
  shadow: typeof shadow;
  toggle: () => void;
}

// Access the active theme. Redesigned screens read colours from here so they
// respond to the manual light/dark switch.
export function useTheme(): Theme {
  const mode = useThemeMode((s) => s.mode);
  const toggle = useThemeMode((s) => s.toggle);
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    font,
    fonts,
    shadow,
    toggle,
  };
}
