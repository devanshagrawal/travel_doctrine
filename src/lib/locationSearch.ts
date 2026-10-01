export interface LocationResult {
  name: string;
  label: string; // "Amer Fort, Amber, Rajasthan, India"
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
}

const API = 'https://photon.komoot.io/api/';

export async function searchLocations(query: string, limit = 5): Promise<LocationResult[]> {
  if (!query.trim() || query.trim().length < 2) return [];
  const url = `${API}?q=${encodeURIComponent(query.trim())}&limit=${limit}`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (!data?.features?.length) return [];
  return data.features.map((f: any) => {
    const p = f.properties ?? {};
    const coords = f.geometry?.coordinates ?? [0, 0];
    const parts = [p.name, p.district, p.city, p.state, p.country].filter(Boolean);
    return {
      name: p.name || query,
      label: [...new Set(parts)].join(', '),
      lat: coords[1],
      lng: coords[0],
      city: p.city || p.district || undefined,
      state: p.state || undefined,
      country: p.country || undefined,
    };
  });
}
