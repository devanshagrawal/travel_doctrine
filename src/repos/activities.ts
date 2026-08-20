import { supabase } from '../lib/supabase';
import { ensureRemote } from '../lib/storage';
import { Activity } from '../lib/types';
import { syncSourceExpense, syncSourceDocument, syncSourceItinerary } from './sync';

interface ActivityRow {
  id: string;
  trip_id: string;
  name: string;
  activity_date: string;
  time: string | null;
  end_time: string | null;
  location: string | null;
  price: number | null;
  currency: string | null;
  platform: string | null;
  booking_proof_uri: string | null;
  notes: string | null;
}

function rowToActivity(r: ActivityRow): Activity {
  return {
    id: r.id,
    tripId: r.trip_id,
    name: r.name,
    activityDate: r.activity_date,
    time: r.time ?? undefined,
    endTime: r.end_time ?? undefined,
    location: r.location ?? undefined,
    price: r.price ?? undefined,
    currency: r.currency ?? undefined,
    platform: r.platform ?? undefined,
    bookingProofUri: r.booking_proof_uri ?? undefined,
    notes: r.notes ?? undefined,
  };
}

export async function listActivities(tripId: string): Promise<Activity[]> {
  const { data, error } = await supabase.from('activities').select('*').eq('trip_id', tripId);
  if (error) throw error;
  return (data as ActivityRow[]).map(rowToActivity);
}

export interface SaveActivityInput {
  tripId: string;
  editingId: string | null;
  name: string;
  activityDate: string;
  time?: string;
  endTime?: string;
  location?: string;
  price: number; // 0 = no price
  currency: string;
  platform?: string;
  categoryId: string | null;
  proofUri?: string;
}

// Add or edit an activity, then keep its linked expense / document / itinerary
// entry in sync (each an idempotent upsert keyed by the activity id).
export async function saveActivity(a: SaveActivityInput): Promise<void> {
  const proofUri = await ensureRemote(a.proofUri, 'documents');
  const fields = {
    name: a.name,
    activity_date: a.activityDate,
    time: a.time ?? null,
    end_time: a.endTime ?? null,
    location: a.location ?? null,
    price: a.price || null,
    currency: a.currency,
    platform: a.platform ?? null,
    booking_proof_uri: proofUri ?? null,
  };

  let activityId = a.editingId;
  if (activityId) {
    const { error } = await supabase.from('activities').update(fields).eq('id', activityId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('activities')
      .insert({ trip_id: a.tripId, ...fields })
      .select('id')
      .single();
    if (error) throw error;
    activityId = (data as { id: string }).id;
  }

  await syncSourceExpense({
    sourceId: activityId,
    tripId: a.tripId,
    categoryId: a.categoryId,
    amount: a.price,
    currency: a.currency,
    description: `Activity – ${a.name}`,
    spentAt: a.activityDate,
    paidBy: 'Me',
  });
  await syncSourceDocument({ sourceId: activityId, sourceTag: 'booking', tripId: a.tripId, type: 'other', title: `Activity – ${a.name} ticket`, fileUri: proofUri });
  await syncSourceItinerary({ sourceId: activityId, tripId: a.tripId, dayDate: a.activityDate, time: a.time, endTime: a.endTime, title: a.name, type: 'activity', location: a.location });
}

export async function attachTicket(activity: Activity, uri: string): Promise<void> {
  const remote = await ensureRemote(uri, 'documents');
  const { error } = await supabase.from('activities').update({ booking_proof_uri: remote }).eq('id', activity.id);
  if (error) throw error;
  await syncSourceDocument({ sourceId: activity.id, sourceTag: 'booking', tripId: activity.tripId, type: 'other', title: `Activity – ${activity.name} ticket`, fileUri: remote });
}

export async function deleteActivity(id: string): Promise<void> {
  await supabase.from('expenses').delete().eq('source_id', id);
  await supabase.from('documents').delete().eq('source_id', id);
  await supabase.from('itinerary_items').delete().eq('source_id', id);
  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) throw error;
}
