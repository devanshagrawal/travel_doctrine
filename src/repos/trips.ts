import { supabase } from '../lib/supabase';
import { Trip } from '../lib/types';

// Default budget categories seeded with every new trip (mirrors the prototype).
const DEFAULT_CATEGORIES = [
  { name: 'Flights', planned: 0, color: '#2563EB', icon: 'airplane' },
  { name: 'Stay', planned: 0, color: '#F97316', icon: 'bed' },
  { name: 'Food', planned: 0, color: '#16A34A', icon: 'restaurant' },
  { name: 'Transport', planned: 0, color: '#9333EA', icon: 'train' },
  { name: 'Activities', planned: 0, color: '#0EA5E9', icon: 'ticket' },
  { name: 'Shopping', planned: 0, color: '#E11D48', icon: 'bag-handle' },
];

// snake_case DB row → camelCase domain type
export interface TripRow {
  id: string;
  owner_id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  base_currency: string;
  total_budget: number;
  cover_color: string;
  cover_image: string | null;
  emoji: string;
  completed_at: string | null;
}

export function rowToTrip(r: TripRow): Trip {
  return {
    id: r.id,
    name: r.name,
    destination: r.destination,
    startDate: r.start_date,
    endDate: r.end_date,
    baseCurrency: r.base_currency,
    totalBudget: Number(r.total_budget),
    coverColor: r.cover_color,
    coverImage: r.cover_image ?? undefined,
    emoji: r.emoji,
    completedAt: r.completed_at,
  };
}

// domain fields → DB columns (only the ones present in `t`)
function tripToRow(t: Partial<Trip>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (t.name !== undefined) row.name = t.name;
  if (t.destination !== undefined) row.destination = t.destination;
  if (t.startDate !== undefined) row.start_date = t.startDate;
  if (t.endDate !== undefined) row.end_date = t.endDate;
  if (t.baseCurrency !== undefined) row.base_currency = t.baseCurrency;
  if (t.totalBudget !== undefined) row.total_budget = t.totalBudget;
  if (t.coverColor !== undefined) row.cover_color = t.coverColor;
  if (t.coverImage !== undefined) row.cover_image = t.coverImage ?? null;
  if (t.emoji !== undefined) row.emoji = t.emoji;
  if (t.completedAt !== undefined) row.completed_at = t.completedAt ?? null;
  return row;
}

export async function listTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as TripRow[]).map(rowToTrip);
}

export async function getTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase.from('trips').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToTrip(data as TripRow) : null;
}

export async function createTrip(input: Omit<Trip, 'id'>): Promise<Trip> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error('Not signed in.');

  // 1) the trip itself (owner_id must equal auth.uid() per RLS)
  const { data: tripRow, error: tErr } = await supabase
    .from('trips')
    .insert({ ...tripToRow(input), owner_id: uid })
    .select('*')
    .single();
  if (tErr) throw tErr;
  const trip = rowToTrip(tripRow as TripRow);

  // 2) the owner's crew row — needed for is_trip_member() to pass on children
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_color')
    .eq('id', uid)
    .maybeSingle();
  await supabase.from('trip_members').insert({
    trip_id: trip.id,
    user_id: uid,
    name: profile?.full_name ?? '',
    email: profile?.email ?? '',
    avatar_color: profile?.avatar_color ?? '#C2703D',
    role: 'owner',
  });

  // 3) default budget categories
  await supabase
    .from('budget_categories')
    .insert(DEFAULT_CATEGORIES.map((c) => ({ ...c, trip_id: trip.id })));

  return trip;
}

export async function updateTrip(id: string, patch: Partial<Trip>): Promise<void> {
  const { error } = await supabase.from('trips').update(tripToRow(patch)).eq('id', id);
  if (error) throw error;
}

export async function setTripCompleted(id: string, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}
