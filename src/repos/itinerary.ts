import { supabase } from '../lib/supabase';
import { ItineraryItem, ItineraryType } from '../lib/types';

interface ItineraryRow {
  id: string;
  trip_id: string;
  day_date: string;
  time: string | null;
  end_time: string | null;
  title: string;
  type: ItineraryType;
  location: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  source_id: string | null;
}

function rowToItem(r: ItineraryRow): ItineraryItem {
  return {
    id: r.id,
    tripId: r.trip_id,
    dayDate: r.day_date,
    time: r.time ?? undefined,
    endTime: r.end_time ?? undefined,
    title: r.title,
    type: r.type,
    location: r.location ?? undefined,
    lat: r.lat ?? undefined,
    lng: r.lng ?? undefined,
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
    end_time: input.endTime ?? null,
    title: input.title,
    type: input.type,
    location: input.location ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    notes: input.notes ?? null,
    source_id: input.sourceId ?? null,
  });
  if (error) throw error;
}

export async function updateItineraryItem(id: string, input: Partial<Omit<ItineraryItem, 'id' | 'tripId' | 'sourceId'>>): Promise<void> {
  const fields: Record<string, unknown> = {};
  if (input.dayDate !== undefined) fields.day_date = input.dayDate;
  if (input.time !== undefined) fields.time = input.time || null;
  if (input.endTime !== undefined) fields.end_time = input.endTime || null;
  if (input.title !== undefined) fields.title = input.title;
  if (input.type !== undefined) fields.type = input.type;
  if (input.location !== undefined) fields.location = input.location || null;
  if (input.lat !== undefined) fields.lat = input.lat ?? null;
  if (input.lng !== undefined) fields.lng = input.lng ?? null;
  if (input.notes !== undefined) fields.notes = input.notes || null;
  const { error } = await supabase.from('itinerary_items').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteItineraryItem(id: string): Promise<void> {
  const { error } = await supabase.from('itinerary_items').delete().eq('id', id);
  if (error) throw error;
}
