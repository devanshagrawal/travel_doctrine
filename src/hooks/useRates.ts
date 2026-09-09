import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { refreshRates, seedRatesFromCache } from '../lib/rates';

// Live FX rates: seeds RATES from the on-device cache once (offline/instant),
// then keeps them fresh from the network. Callers use convert() as before.
export function useRates() {
  React.useEffect(() => {
    seedRatesFromCache();
  }, []);

  return useQuery({
    queryKey: ['fx-rates'],
    queryFn: refreshRates,
    staleTime: 1000 * 60 * 60 * 6, // 6h — rates only move daily
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
