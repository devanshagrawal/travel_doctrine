import { CurrencyCode } from './types';

// Exchange rates relative to USD (1 USD = rate). These are static fallbacks so
// the app works offline / on first launch; at runtime they're overwritten with
// live rates via applyRates() (see src/lib/rates.ts) — callers use convert()
// unchanged and pick up whatever is in RATES.
export const RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.2,
  JPY: 156.4,
  AUD: 1.51,
  CAD: 1.36,
  SGD: 1.35,
  AED: 3.67,
  THB: 36.5,
  CHF: 0.88,
  CNY: 7.24,
};

// When the live rates in RATES were last refreshed (the provider's timestamp),
// or null while still on the static fallback.
export let ratesUpdatedAt: string | null = null;

// Overwrite RATES in place with live values for our supported currencies.
// Only positive numbers are applied; USD stays the 1.0 base.
export function applyRates(rates: Record<string, number>, updatedAt?: string | null): void {
  for (const c of CURRENCIES) {
    const v = rates[c.code];
    if (typeof v === 'number' && v > 0) RATES[c.code] = v;
  }
  RATES.USD = 1;
  if (updatedAt !== undefined) ratesUpdatedAt = updatedAt;
}

export interface CurrencyMeta {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
];

export function currencyMeta(code: CurrencyCode): CurrencyMeta {
  return (
    CURRENCIES.find((c) => c.code === code) || {
      code,
      name: code,
      symbol: code,
      flag: '🏳️',
    }
  );
}

// Convert an amount between any two supported currencies.
export function convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  const fromRate = RATES[from] ?? 1;
  const toRate = RATES[to] ?? 1;
  const inUsd = amount / fromRate;
  return inUsd * toRate;
}

export function formatMoney(amount: number, code: CurrencyCode, opts?: { compact?: boolean }): string {
  const meta = currencyMeta(code);
  const abs = Math.abs(amount);
  let value: string;
  if (opts?.compact && abs >= 1000) {
    value = (amount / 1000).toFixed(abs >= 10000 ? 0 : 1) + 'k';
  } else {
    // No decimals for zero-decimal currencies like JPY.
    const decimals = code === 'JPY' || code === 'INR' ? 0 : abs >= 1000 ? 0 : 2;
    value = amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return `${meta.symbol}${value}`;
}
