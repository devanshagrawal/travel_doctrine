import { supabase } from '../lib/supabase';
import { TravelDocument, DocumentType } from '../lib/types';
import { currentUserId } from './sync';

interface DocumentRow {
  id: string;
  owner_id: string;
  trip_id: string | null;
  type: DocumentType;
  title: string;
  file_uri: string | null;
  number: string | null;
  expiry_date: string | null;
  source_id: string | null;
  source_tag: string | null;
}

function rowToDocument(r: DocumentRow): TravelDocument {
  return {
    id: r.id,
    tripId: r.trip_id,
    type: r.type,
    title: r.title,
    fileUri: r.file_uri ?? undefined,
    number: r.number ?? undefined,
    expiryDate: r.expiry_date ?? undefined,
    sourceId: r.source_id ?? undefined,
    sourceTag: r.source_tag ?? undefined,
  };
}

// tripId null → the owner's global wallet (documents not tied to a trip).
export async function listDocuments(tripId: string | null): Promise<TravelDocument[]> {
  let query = supabase.from('documents').select('*');
  query = tripId === null ? query.is('trip_id', null) : query.eq('trip_id', tripId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DocumentRow[]).map(rowToDocument);
}

export async function addDocument(input: Omit<TravelDocument, 'id'>): Promise<void> {
  const owner = await currentUserId();
  const { error } = await supabase.from('documents').insert({
    owner_id: owner,
    trip_id: input.tripId,
    type: input.type,
    title: input.title,
    file_uri: input.fileUri ?? null,
    number: input.number ?? null,
    expiry_date: input.expiryDate ?? null,
    source_id: input.sourceId ?? null,
    source_tag: input.sourceTag ?? null,
  });
  if (error) throw error;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}
