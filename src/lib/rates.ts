import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyRates } from './currency';

// Free, no-key, USD-based, CORS-friendly. Rates update roughly daily.
const API_URL = 'https://open.er-api.com/v6/latest/USD';
const CACHE_KEY = 'fx-rates-v1';

export interface RatesResult {
  updatedAt: string | null;
  source: 'live' | 'cache';
}

// Seed RATES from the last successful fetch so the converter is correct
// instantly and offline. Call once on app start (before the network refresh).
export async function seedRatesFromCache(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const cached = JSON.parse(raw) as { rates: Record<string, number>; updatedAt: string | null };
    if (cached?.rates) applyRates(cached.rates, cached.updatedAt ?? null);
  } catch {
    // ignore — fall back to the static defaults in RATES
  }
}

// Fetch live rates, apply them app-wide, and cache for next launch. Throws on
// failure so React Query keeps the last good data (rates stay whatever they are).
export async function refreshRates(): Promise<RatesResult> {
  const resp = await fetch(API_URL);
  const data = await resp.json();
  if (data?.result !== 'success' || !data?.rates) throw new Error('Live rates unavailable');
  const updatedAt: string | null = data.time_last_update_utc ?? null;
  applyRates(data.rates, updatedAt);
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ rates: data.rates, updatedAt }));
  } catch {
    // caching is best-effort
  }
  return { updatedAt, source: 'live' };
}
