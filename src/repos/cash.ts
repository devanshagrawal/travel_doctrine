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

  let walletId: string;
  if (existing) {
    const w = existing as WalletRow;
    walletId = w.id;
    const { error } = await supabase
      .from('cash_wallets')
      .update({ balance: Number(w.balance) + amount, loaded: Number(w.loaded) + amount })
      .eq('id', w.id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('cash_wallets')
      .insert({ trip_id: tripId, currency, balance: amount, loaded: amount })
      .select('id')
      .single();
    if (error) throw error;
    walletId = (data as { id: string }).id;
  }

  // The counted expense for buying the cash. Linked to the wallet (source_id)
  // so it's protected from direct deletion — cash is managed on the wallet.
  const { error: eErr } = await supabase.from('expenses').insert({
    trip_id: tripId,
    category_id: null,
    amount,
    currency,
    description: `Cash withdrawal (${currency})`,
    spent_at: new Date().toISOString().slice(0, 10),
    paid_from: 'regular',
    source_id: walletId,
  });
  if (eErr) throw eErr;
}

// Remove a cash wallet and everything tied to it: its top-up expense(s)
// (source_id = wallet id) and the cash spends drawn from it (paid_from 'cash'
// in the wallet's currency). Model A: this "un-buys" the cash entirely.
export async function deleteCashWallet(walletId: string, tripId: string, currency: string): Promise<void> {
  await supabase.from('expenses').delete().eq('source_id', walletId); // top-ups
  await supabase
    .from('expenses')
    .delete()
    .eq('trip_id', tripId)
    .eq('paid_from', 'cash')
    .eq('currency', currency); // cash spends
  const { error } = await supabase.from('cash_wallets').delete().eq('id', walletId);
  if (error) throw error;
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
