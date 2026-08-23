import { supabase } from '../lib/supabase';
import { ensureRemote } from '../lib/storage';
import { Expense, SplitType } from '../lib/types';

interface ExpenseRow {
  id: string;
  trip_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  description: string;
  spent_at: string;
  paid_by: string | null;
  paid_by_id: string | null;
  split_type: SplitType;
  paid_from: 'regular' | 'cash';
  source_id: string | null;
  receipt_uri: string | null;
  status: 'pending' | 'confirmed';
  expense_splits?: { member_id: string }[];
}

function rowToExpense(r: ExpenseRow): Expense {
  return {
    id: r.id,
    tripId: r.trip_id,
    categoryId: r.category_id,
    amount: Number(r.amount),
    currency: r.currency,
    description: r.description,
    spentAt: r.spent_at,
    paidBy: r.paid_by ?? undefined,
    paidById: r.paid_by_id ?? undefined,
    splitType: r.split_type,
    splitWith: r.expense_splits?.map((s) => s.member_id),
    paidFrom: r.paid_from,
    sourceId: r.source_id ?? undefined,
    receiptUri: r.receipt_uri ?? undefined,
    status: r.status,
  };
}

export async function listExpenses(tripId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, expense_splits(member_id)')
    .eq('trip_id', tripId)
    .order('spent_at', { ascending: false });
  if (error) throw error;
  return (data as ExpenseRow[]).map(rowToExpense);
}

// Every expense across all trips the user belongs to (RLS-scoped). Used to
// show per-trip "spent" on the trips home without a query per card.
export async function listAllExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase.from('expenses').select('*, expense_splits(member_id)');
  if (error) throw error;
  return (data as ExpenseRow[]).map(rowToExpense);
}

export async function addExpense(input: Omit<Expense, 'id'>): Promise<Expense> {
  const receiptUri = await ensureRemote(input.receiptUri, 'documents');
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      trip_id: input.tripId,
      category_id: input.categoryId,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      spent_at: input.spentAt,
      paid_by: input.paidBy ?? null,
      paid_by_id: input.paidById ?? null,
      split_type: input.splitType ?? 'none',
      paid_from: input.paidFrom ?? 'regular',
      source_id: input.sourceId ?? null,
      receipt_uri: receiptUri ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  const created = rowToExpense(data as ExpenseRow);

  // Equal split: record each participant as a row in expense_splits.
  if (input.splitType === 'equal' && input.splitWith?.length) {
    const { error: sErr } = await supabase
      .from('expense_splits')
      .insert(input.splitWith.map((memberId) => ({ expense_id: created.id, member_id: memberId })));
    if (sErr) throw sErr;
    created.splitWith = input.splitWith;
  }
  return created;
}

export async function deleteExpense(id: string): Promise<void> {
  // expense_splits rows cascade via the FK on delete.
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// Attach (or replace) a receipt image on an existing expense.
export async function attachReceipt(id: string, uri: string): Promise<void> {
  const remote = await ensureRemote(uri, 'documents');
  const { error } = await supabase.from('expenses').update({ receipt_uri: remote }).eq('id', id);
  if (error) throw error;
}

// Scan flow: upload the receipt and create a PENDING expense. A DB webhook then
// runs OCR (Gemini) and fills in the fields; a member reviews & approves it.
export async function createPendingScan(tripId: string, imageUri: string, baseCurrency: string): Promise<void> {
  const receiptUri = await ensureRemote(imageUri, 'documents');
  const { error } = await supabase.from('expenses').insert({
    trip_id: tripId,
    amount: 0,
    currency: baseCurrency,
    description: 'Scanning receipt…',
    spent_at: new Date().toISOString().slice(0, 10),
    paid_from: 'regular',
    receipt_uri: receiptUri,
    status: 'pending',
  });
  if (error) throw error;
}

// Approve a pending expense (optionally applying reviewer edits) → it now counts.
export async function approveExpense(id: string, patch?: Partial<Expense>): Promise<void> {
  const row: Record<string, unknown> = { status: 'confirmed' };
  if (patch?.description !== undefined) row.description = patch.description;
  if (patch?.amount !== undefined) row.amount = patch.amount;
  if (patch?.currency !== undefined) row.currency = patch.currency;
  if (patch?.spentAt !== undefined) row.spent_at = patch.spentAt;
  if (patch?.categoryId !== undefined) row.category_id = patch.categoryId;
  const { error } = await supabase.from('expenses').update(row).eq('id', id);
  if (error) throw error;
}
