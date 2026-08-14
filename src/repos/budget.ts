import { supabase } from '../lib/supabase';
import { BudgetCategory } from '../lib/types';

export interface CategoryRow {
  id: string;
  trip_id: string;
  name: string;
  planned: number;
  color: string;
  icon: string;
}

export function rowToCategory(r: CategoryRow): BudgetCategory {
  return { id: r.id, tripId: r.trip_id, name: r.name, planned: Number(r.planned), color: r.color, icon: r.icon };
}

export async function listCategories(tripId: string): Promise<BudgetCategory[]> {
  const { data, error } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('trip_id', tripId);
  if (error) throw error;
  return (data as CategoryRow[]).map(rowToCategory);
}
