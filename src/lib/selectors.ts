import { BudgetCategory, Expense, Trip } from './types';
import { convert } from './currency';

// Total spent on a trip, expressed in the trip's base currency.
export function spentForTrip(expenses: Expense[], trip: Trip): number {
  return expenses
    .filter((e) => e.tripId === trip.id)
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
  const tripExpenses = expenses.filter((e) => e.tripId === trip.id);

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
