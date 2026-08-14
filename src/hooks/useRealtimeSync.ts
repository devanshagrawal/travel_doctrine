import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Tables whose changes should refresh the UI live. (Requires them to be in the
// supabase_realtime publication — see supabase/migrations/0002_realtime.sql.)
const TABLES = [
  'trips', 'trip_members', 'budget_categories', 'expenses', 'expense_splits',
  'cash_wallets', 'settlements', 'itinerary_items', 'todos', 'flights', 'hotels', 'documents',
];

// One global subscription: on any change to a watched table, invalidate the
// React Query caches so the current screen refetches. We only use the event as
// a signal — the refetch itself is RLS-scoped, so nothing leaks. Harmless (just
// inert) until the realtime migration is applied.
export function useRealtimeSync(enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase.channel('wander-db-changes');
    TABLES.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        qc.invalidateQueries();
      });
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, qc]);
}
