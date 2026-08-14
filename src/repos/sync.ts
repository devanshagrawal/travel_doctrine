import { supabase } from '../lib/supabase';
import { DocumentType, ItineraryType } from '../lib/types';

export async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Not signed in.');
  return id;
}

// Upsert exactly one expense for a flight/hotel source. amount<=0 removes it.
export async function syncSourceExpense(p: {
  sourceId: string;
  tripId: string;
  categoryId: string | null;
  amount: number;
  currency: string;
  description: string;
  spentAt: string;
  paidBy?: string;
}): Promise<void> {
  await supabase.from('expenses').delete().eq('source_id', p.sourceId);
  if (p.amount > 0) {
    const { error } = await supabase.from('expenses').insert({
      trip_id: p.tripId,
      category_id: p.categoryId,
      amount: p.amount,
      currency: p.currency,
      description: p.description,
      spent_at: p.spentAt,
      paid_by: p.paidBy ?? null,
      paid_from: 'regular',
      source_id: p.sourceId,
    });
    if (error) throw error;
  }
}

// Upsert one document per (sourceId, sourceTag). Empty fileUri removes it.
export async function syncSourceDocument(p: {
  sourceId: string;
  sourceTag: string;
  tripId: string;
  type: DocumentType;
  title: string;
  fileUri?: string;
}): Promise<void> {
  await supabase.from('documents').delete().eq('source_id', p.sourceId).eq('source_tag', p.sourceTag);
  if (p.fileUri) {
    const owner = await currentUserId();
    const { error } = await supabase.from('documents').insert({
      owner_id: owner,
      trip_id: p.tripId,
      type: p.type,
      title: p.title,
      file_uri: p.fileUri,
      source_id: p.sourceId,
      source_tag: p.sourceTag,
    });
    if (error) throw error;
  }
}

// Upsert exactly one itinerary entry for a flight/hotel source.
export async function syncSourceItinerary(p: {
  sourceId: string;
  tripId: string;
  dayDate: string;
  time?: string;
  title: string;
  type: ItineraryType;
  location?: string;
}): Promise<void> {
  await supabase.from('itinerary_items').delete().eq('source_id', p.sourceId);
  const { error } = await supabase.from('itinerary_items').insert({
    trip_id: p.tripId,
    day_date: p.dayDate,
    time: p.time ?? null,
    title: p.title,
    type: p.type,
    location: p.location ?? null,
    source_id: p.sourceId,
  });
  if (error) throw error;
}
