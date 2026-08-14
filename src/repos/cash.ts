import { supabase } from '../lib/supabase';
import { CashWallet } from '../lib/types';

interface WalletRow {
  id: string;
  trip_id: string;
  currency: string;
  balance: number;
  loaded: number;
}

function rowToWallet(r: WalletRow): CashWallet {
  return { id: r.id, tripId: r.trip_id, currency: r.currency, balance: Number(r.balance), loaded: Number(r.loaded) };
}

export async function listWallets(tripId: string): Promise<CashWallet[]> {
  const { data, error } = await supabase.from('cash_wallets').select('*').eq('trip_id', tripId);
  if (error) throw error;
  return (data as WalletRow[]).map(rowToWallet);
}

// Model A: buying cash counts as spent now (a regular expense) and tops up the
// wallet. Spending it later draws the balance down without re-counting.
export async function loadCash(tripId: string, currency: string, amount: number): Promise<void> {
  const { data: existing } = await supabase
    .from('cash_wallets')
    .select('*')
    .eq('trip_id', tripId)
    .eq('currency', currency)
    .maybeSingle();

  if (existing) {
    const w = existing as WalletRow;
    const { error } = await supabase
      .from('cash_wallets')
      .update({ balance: Number(w.balance) + amount, loaded: Number(w.loaded) + amount })
      .eq('id', w.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('cash_wallets')
      .insert({ trip_id: tripId, currency, balance: amount, loaded: amount });
    if (error) throw error;
  }

  // The counted expense for buying the cash.
  const { error: eErr } = await supabase.from('expenses').insert({
    trip_id: tripId,
    category_id: null,
    amount,
    currency,
    description: `Cash withdrawal (${currency})`,
    spent_at: new Date().toISOString().slice(0, 10),
    paid_from: 'regular',
  });
  if (eErr) throw eErr;
}

// Adjust a wallet balance by delta (clamped at 0). Used when spending cash
// (negative) or refunding a deleted cash expense (positive).
export async function adjustCash(walletId: string, delta: number): Promise<void> {
  const { data, error } = await supabase.from('cash_wallets').select('balance').eq('id', walletId).single();
  if (error) throw error;
  const next = Math.max(0, Number((data as { balance: number }).balance) + delta);
  const { error: uErr } = await supabase.from('cash_wallets').update({ balance: next }).eq('id', walletId);
  if (uErr) throw uErr;
}
