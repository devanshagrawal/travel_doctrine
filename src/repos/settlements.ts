import { supabase } from '../lib/supabase';
import { Settlement } from '../lib/types';

interface SettlementRow {
  id: string;
  trip_id: string;
  from_id: string;
  to_id: string;
  amount: number;
  created_at: string;
}

function rowToSettlement(r: SettlementRow): Settlement {
  return { id: r.id, tripId: r.trip_id, fromId: r.from_id, toId: r.to_id, amount: Number(r.amount), createdAt: r.created_at };
}

export async function listSettlements(tripId: string): Promise<Settlement[]> {
  const { data, error } = await supabase.from('settlements').select('*').eq('trip_id', tripId);
  if (error) throw error;
  return (data as SettlementRow[]).map(rowToSettlement);
}

export async function addSettlement(input: Omit<Settlement, 'id' | 'createdAt'>): Promise<void> {
  const { error } = await supabase.from('settlements').insert({
    trip_id: input.tripId,
    from_id: input.fromId,
    to_id: input.toId,
    amount: input.amount,
  });
  if (error) throw error;
}

export async function deleteSettlement(id: string): Promise<void> {
  const { error } = await supabase.from('settlements').delete().eq('id', id);
  if (error) throw error;
}
