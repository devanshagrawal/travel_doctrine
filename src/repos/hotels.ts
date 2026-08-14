import { supabase } from '../lib/supabase';
import { Hotel } from '../lib/types';
import { syncSourceExpense, syncSourceDocument, syncSourceItinerary } from './sync';

interface HotelRow {
  id: string;
  trip_id: string;
  name: string;
  check_in: string;
  check_out: string;
  total_price: number | null;
  currency: string | null;
  proof_uri: string | null;
  address: string | null;
  confirmation_no: string | null;
  price_per_night: number | null;
}

function rowToHotel(r: HotelRow): Hotel {
  return {
    id: r.id,
    tripId: r.trip_id,
    name: r.name,
    checkIn: r.check_in,
    checkOut: r.check_out,
    totalPrice: r.total_price ?? undefined,
    currency: r.currency ?? undefined,
    proofUri: r.proof_uri ?? undefined,
    address: r.address ?? undefined,
    confirmationNo: r.confirmation_no ?? undefined,
    pricePerNight: r.price_per_night ?? undefined,
  };
}

export async function listHotels(tripId: string): Promise<Hotel[]> {
  const { data, error } = await supabase.from('hotels').select('*').eq('trip_id', tripId);
  if (error) throw error;
  return (data as HotelRow[]).map(rowToHotel);
}

export interface SaveHotelInput {
  tripId: string;
  editingId: string | null;
  name: string;
  checkIn: string;
  checkOut: string;
  price: number; // 0 = no price
  currency: string;
  categoryId: string | null;
  proofUri?: string;
}

export async function saveHotel(a: SaveHotelInput): Promise<void> {
  const fields = {
    name: a.name,
    check_in: a.checkIn,
    check_out: a.checkOut,
    total_price: a.price || null,
    currency: a.currency,
    proof_uri: a.proofUri ?? null,
  };

  let hotelId = a.editingId;
  if (hotelId) {
    const { error } = await supabase.from('hotels').update(fields).eq('id', hotelId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('hotels')
      .insert({ trip_id: a.tripId, ...fields })
      .select('id')
      .single();
    if (error) throw error;
    hotelId = (data as { id: string }).id;
  }

  await syncSourceExpense({
    sourceId: hotelId,
    tripId: a.tripId,
    categoryId: a.categoryId,
    amount: a.price,
    currency: a.currency,
    description: `Hotel – ${a.name}`,
    spentAt: a.checkIn,
    paidBy: 'Me',
  });
  await syncSourceDocument({ sourceId: hotelId, sourceTag: 'booking', tripId: a.tripId, type: 'other', title: `Hotel – ${a.name} booking`, fileUri: a.proofUri });
  await syncSourceItinerary({ sourceId: hotelId, tripId: a.tripId, dayDate: a.checkIn, time: '15:00', title: `Check in – ${a.name}`, type: 'stay', location: a.name });
}

export async function attachHotelProof(hotel: Hotel, uri: string): Promise<void> {
  const { error } = await supabase.from('hotels').update({ proof_uri: uri }).eq('id', hotel.id);
  if (error) throw error;
  await syncSourceDocument({ sourceId: hotel.id, sourceTag: 'booking', tripId: hotel.tripId, type: 'other', title: `Hotel – ${hotel.name} booking`, fileUri: uri });
}

export async function deleteHotel(id: string): Promise<void> {
  await supabase.from('expenses').delete().eq('source_id', id);
  await supabase.from('documents').delete().eq('source_id', id);
  await supabase.from('itinerary_items').delete().eq('source_id', id);
  const { error } = await supabase.from('hotels').delete().eq('id', id);
  if (error) throw error;
}
