import { supabase } from '../lib/supabase';
import { ensureRemote } from '../lib/storage';
import { Flight } from '../lib/types';
import { syncSourceExpense, syncSourceDocument, syncSourceItinerary } from './sync';

interface FlightRow {
  id: string;
  trip_id: string;
  airline: string;
  depart_at: string;
  price: number | null;
  currency: string | null;
  platform: string | null;
  booking_proof_uri: string | null;
  boarding_pass_uri: string | null;
  flight_no: string | null;
  from_code: string | null;
  to_code: string | null;
  from_city: string | null;
  to_city: string | null;
  arrive_at: string | null;
  seat: string | null;
}

function rowToFlight(r: FlightRow): Flight {
  return {
    id: r.id,
    tripId: r.trip_id,
    airline: r.airline,
    departAt: r.depart_at,
    price: r.price ?? undefined,
    currency: r.currency ?? undefined,
    platform: r.platform ?? undefined,
    bookingProofUri: r.booking_proof_uri ?? undefined,
    boardingPassUri: r.boarding_pass_uri ?? undefined,
    flightNo: r.flight_no ?? undefined,
    fromCode: r.from_code ?? undefined,
    toCode: r.to_code ?? undefined,
    fromCity: r.from_city ?? undefined,
    toCity: r.to_city ?? undefined,
    arriveAt: r.arrive_at ?? undefined,
    seat: r.seat ?? undefined,
  };
}

export async function listFlights(tripId: string): Promise<Flight[]> {
  const { data, error } = await supabase.from('flights').select('*').eq('trip_id', tripId);
  if (error) throw error;
  return (data as FlightRow[]).map(rowToFlight);
}

export interface SaveFlightInput {
  tripId: string;
  editingId: string | null;
  airline: string;
  fromCode: string;
  toCode: string;
  dayPart: string; // YYYY-MM-DD
  timePart: string; // departure HH:mm ('' → none)
  arrTimePart?: string; // arrival HH:mm ('' → none)
  price: number; // 0 = no price
  currency: string;
  platform?: string;
  categoryId: string | null;
  proofUri?: string;
  boardingUri?: string;
}

// Add or edit a flight, then keep its linked expense / documents / itinerary
// entry in sync (each an idempotent upsert keyed by the flight id).
export async function saveFlight(a: SaveFlightInput): Promise<void> {
  const departAt = `${a.dayPart}T${a.timePart || '00:00'}:00`;
  const arriveAt = a.arrTimePart ? `${a.dayPart}T${a.arrTimePart}:00` : null;
  // Upload any newly-picked images so the flight row and its linked document
  // store durable URLs, not local file:// paths.
  const proofUri = await ensureRemote(a.proofUri, 'documents');
  const boardingUri = await ensureRemote(a.boardingUri, 'documents');
  const fields = {
    airline: a.airline,
    from_code: a.fromCode,
    to_code: a.toCode,
    depart_at: departAt,
    arrive_at: arriveAt,
    price: a.price || null,
    currency: a.currency,
    platform: a.platform ?? null,
    booking_proof_uri: proofUri ?? null,
    boarding_pass_uri: boardingUri ?? null,
  };

  let flightId = a.editingId;
  if (flightId) {
    const { error } = await supabase.from('flights').update(fields).eq('id', flightId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('flights')
      .insert({ trip_id: a.tripId, ...fields })
      .select('id')
      .single();
    if (error) throw error;
    flightId = (data as { id: string }).id;
  }

  const routeLabel = `${a.fromCode} → ${a.toCode}`;
  await syncSourceExpense({
    sourceId: flightId,
    tripId: a.tripId,
    categoryId: a.categoryId,
    amount: a.price,
    currency: a.currency,
    description: `Flight – ${a.airline} (${routeLabel})`,
    spentAt: a.dayPart,
    paidBy: 'Me',
  });
  await syncSourceDocument({ sourceId: flightId, sourceTag: 'booking', tripId: a.tripId, type: 'other', title: `Flight – ${a.airline} booking`, fileUri: proofUri });
  await syncSourceDocument({ sourceId: flightId, sourceTag: 'boarding', tripId: a.tripId, type: 'other', title: `Flight – ${a.airline} boarding pass`, fileUri: boardingUri });
  await syncSourceItinerary({ sourceId: flightId, tripId: a.tripId, dayDate: a.dayPart, time: a.timePart || undefined, title: `Flight – ${a.airline} (${routeLabel})`, type: 'transport' });
}

// Attach a boarding pass to an existing flight and surface it in Documents.
export async function attachBoardingPass(flight: Flight, uri: string): Promise<void> {
  const remote = await ensureRemote(uri, 'documents');
  const { error } = await supabase.from('flights').update({ boarding_pass_uri: remote }).eq('id', flight.id);
  if (error) throw error;
  await syncSourceDocument({ sourceId: flight.id, sourceTag: 'boarding', tripId: flight.tripId, type: 'other', title: `Flight – ${flight.airline} boarding pass`, fileUri: remote });
}

// Delete a flight and everything auto-created from it.
export async function deleteFlight(id: string): Promise<void> {
  await supabase.from('expenses').delete().eq('source_id', id);
  await supabase.from('documents').delete().eq('source_id', id);
  await supabase.from('itinerary_items').delete().eq('source_id', id);
  const { error } = await supabase.from('flights').delete().eq('id', id);
  if (error) throw error;
}
