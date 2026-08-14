import { BudgetCategory, Collaborator, Expense, Settlement, Trip } from './types';
import { convert } from './currency';

// Total spent on a trip, expressed in the trip's base currency.
// Cash spends (paidFrom === 'cash') are excluded — the cash was already
// counted when it was loaded (Model A), so counting it again would double-up.
export function spentForTrip(expenses: Expense[], trip: Trip): number {
  return expenses
    .filter((e) => e.tripId === trip.id && e.paidFrom !== 'cash')
    .reduce((sum, e) => sum + convert(e.amount, e.currency, trip.baseCurrency), 0);
}

// Spend grouped by budget category (base currency), including an
// "Uncategorized" bucket for expenses with no category.
export interface CategorySpend {
  category: BudgetCategory | null;
  name: string;
  color: string;
  planned: number;
  spent: number;
}

export function spendByCategory(
  expenses: Expense[],
  categories: BudgetCategory[],
  trip: Trip
): CategorySpend[] {
  const cats = categories.filter((c) => c.tripId === trip.id);
  const tripExpenses = expenses.filter((e) => e.tripId === trip.id && e.paidFrom !== 'cash');

  const rows: CategorySpend[] = cats.map((c) => ({
    category: c,
    name: c.name,
    color: c.color,
    planned: c.planned,
    spent: tripExpenses
      .filter((e) => e.categoryId === c.id)
      .reduce((s, e) => s + convert(e.amount, e.currency, trip.baseCurrency), 0),
  }));

  const uncategorized = tripExpenses
    .filter((e) => !e.categoryId || !cats.some((c) => c.id === e.categoryId))
    .reduce((s, e) => s + convert(e.amount, e.currency, trip.baseCurrency), 0);

  if (uncategorized > 0) {
    rows.push({ category: null, name: 'Uncategorized', color: '#94A3B8', planned: 0, spent: uncategorized });
  }
  return rows;
}

// Find a trip's budget category whose name loosely matches any candidate
// (case-insensitive). Used to auto-file flight/hotel expenses under the
// right category. Returns null if nothing matches (→ Uncategorized).
export function findCategoryId(
  categories: BudgetCategory[],
  tripId: string,
  candidates: string[]
): string | null {
  const cats = categories.filter((c) => c.tripId === tripId);
  const lower = candidates.map((c) => c.toLowerCase());
  const hit = cats.find((c) => lower.some((cand) => c.name.toLowerCase().includes(cand)));
  return hit ? hit.id : null;
}

export function budgetSummary(expenses: Expense[], trip: Trip) {
  const spent = spentForTrip(expenses, trip);
  const remaining = trip.totalBudget - spent;
  const pct = trip.totalBudget > 0 ? spent / trip.totalBudget : 0;
  const tone: 'ok' | 'warn' | 'over' = pct >= 1 ? 'over' : pct >= 0.8 ? 'warn' : 'ok';
  return { spent, remaining, pct, tone, budget: trip.totalBudget };
}

// ---- Split-expense balances (in the trip's base currency) ----
export interface Balance {
  collaborator: Collaborator;
  net: number; // > 0 they are owed; < 0 they owe
}

export function tripBalances(
  trip: Trip,
  expenses: Expense[],
  collaborators: Collaborator[],
  settlements: Settlement[]
): Balance[] {
  const crew = collaborators.filter((c) => c.tripId === trip.id);
  const net: Record<string, number> = {};
  crew.forEach((c) => (net[c.id] = 0));

  // Shared expenses: payer fronts the whole amount; participants each owe a share.
  expenses
    .filter((e) => e.tripId === trip.id && e.splitType === 'equal' && (e.splitWith?.length ?? 0) > 0 && e.paidById)
    .forEach((e) => {
      const amt = convert(e.amount, e.currency, trip.baseCurrency);
      const parts = e.splitWith!.filter((id) => id in net);
      if (parts.length === 0 || !(e.paidById! in net)) return;
      const share = amt / parts.length;
      net[e.paidById!] += amt;
      parts.forEach((id) => (net[id] -= share));
    });

  // Settlements: a payoff reduces the payer's debt and the receiver's credit.
  settlements
    .filter((st) => st.tripId === trip.id)
    .forEach((st) => {
      if (st.fromId in net) net[st.fromId] += st.amount;
      if (st.toId in net) net[st.toId] -= st.amount;
    });

  return crew.map((c) => ({ collaborator: c, net: Math.round(net[c.id] * 100) / 100 }));
}

// Greedy "who owes whom" suggestions from the net balances.
export function settleSuggestions(balances: Balance[]): { fromId: string; toId: string; amount: number }[] {
  const debtors = balances.filter((b) => b.net < -0.01).map((b) => ({ id: b.collaborator.id, amt: -b.net })).sort((a, b) => b.amt - a.amt);
  const creditors = balances.filter((b) => b.net > 0.01).map((b) => ({ id: b.collaborator.id, amt: b.net })).sort((a, b) => b.amt - a.amt);
  const out: { fromId: string; toId: string; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    out.push({ fromId: debtors[i].id, toId: creditors[j].id, amount: Math.round(pay * 100) / 100 });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt < 0.01) i++;
    if (creditors[j].amt < 0.01) j++;
  }
  return out;
}
