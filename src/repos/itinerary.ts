import { supabase } from '../lib/supabase';
import { ItineraryItem, ItineraryType } from '../lib/types';

interface ItineraryRow {
  id: string;
  trip_id: string;
  day_date: string;
  time: string | null;
  title: string;
  type: ItineraryType;
  location: string | null;
  notes: string | null;
  source_id: string | null;
}

function rowToItem(r: ItineraryRow): ItineraryItem {
  return {
    id: r.id,
    tripId: r.trip_id,
    dayDate: r.day_date,
    time: r.time ?? undefined,
    title: r.title,
    type: r.type,
    location: r.location ?? undefined,
    notes: r.notes ?? undefined,
    sourceId: r.source_id ?? undefined,
  };
}

export async function listItinerary(tripId: string): Promise<ItineraryItem[]> {
  const { data, error } = await supabase
    .from('itinerary_items')
    .select('*')
    .eq('trip_id', tripId);
  if (error) throw error;
  return (data as ItineraryRow[]).map(rowToItem);
}

export async function addItineraryItem(input: Omit<ItineraryItem, 'id'>): Promise<void> {
  const { error } = await supabase.from('itinerary_items').insert({
    trip_id: input.tripId,
    day_date: input.dayDate,
    time: input.time ?? null,
    title: input.title,
    type: input.type,
    location: input.location ?? null,
    notes: input.notes ?? null,
    source_id: input.sourceId ?? null,
  });
  if (error) throw error;
}

export async function deleteItineraryItem(id: string): Promise<void> {
  const { error } = await supabase.from('itinerary_items').delete().eq('id', id);
  if (error) throw error;
}
