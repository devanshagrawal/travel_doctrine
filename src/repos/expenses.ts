import { supabase } from '../lib/supabase';
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

export async function addExpense(input: Omit<Expense, 'id'>): Promise<Expense> {
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
