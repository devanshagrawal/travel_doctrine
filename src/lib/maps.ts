import { Linking } from 'react-native';

// Open a place in the device's maps app / Google Maps (web opens a new tab).
// Uses the universal Google Maps search URL, which resolves on every platform.
export function openInMaps(...parts: (string | undefined)[]): void {
  const query = parts.filter(Boolean).join(', ').trim();
  if (!query) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  Linking.openURL(url).catch(() => {});
}
