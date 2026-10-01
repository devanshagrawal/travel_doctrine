import { Linking } from 'react-native';

export function openInMaps(name?: string, location?: string, city?: string, lat?: number, lng?: number): void {
  if (lat != null && lng != null) {
    const label = [name, location, city].filter(Boolean).join(', ');
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}${label ? `&query_place_id=${encodeURIComponent(label)}` : ''}`;
    Linking.openURL(url).catch(() => {});
    return;
  }
  const query = [name, location, city].filter(Boolean).join(', ').trim();
  if (!query) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  Linking.openURL(url).catch(() => {});
}
