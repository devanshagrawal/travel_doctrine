// Domain types for the whole app. These mirror what a real backend
// (e.g. Supabase tables) would return, so screens won't change when
// the mock store is swapped for a real API later.

export type CurrencyCode = string; // e.g. 'USD', 'INR', 'EUR'

export interface User {
  id: string;
  fullName: string;
  email: string;
  homeCurrency: CurrencyCode;
  avatarColor: string;
}

export type ItineraryType = 'activity' | 'transport' | 'food' | 'stay' | 'other';

export interface ItineraryItem {
  id: string;
  tripId: string;
  dayDate: string; // ISO date 'YYYY-MM-DD'
  time?: string; // 'HH:mm'
  title: string;
  type: ItineraryType;
  location?: string;
  notes?: string;
  sourceId?: string; // if auto-created from a flight/hotel, that record's id
}

export interface BudgetCategory {
  id: string;
  tripId: string;
  name: string;
  planned: number; // in trip base currency
  color: string;
  icon: string; // ionicons name
}

export type SplitType = 'none' | 'equal';

export interface Expense {
  id: string;
  tripId: string;
  categoryId: string | null;
  amount: number; // in `currency`
  currency: CurrencyCode;
  description: string;
  spentAt: string; // ISO date
  paidBy?: string; // legacy display label
  paidById?: string; // collaborator id who paid (for splitting)
  splitType?: SplitType; // 'equal' = shared among splitWith; else personal
  splitWith?: string[]; // collaborator ids sharing the cost equally
  paidFrom?: 'regular' | 'cash'; // 'cash' draws the cash wallet & isn't re-counted (Model A)
  sourceId?: string; // if auto-created from a flight/hotel, that record's id
}

// A foreign-cash pool for a trip. You "load" cash (counted as spent then),
// and spending from it draws the balance down without re-counting (Model A).
export interface CashWallet {
  id: string;
  tripId: string;
  currency: CurrencyCode;
  balance: number; // remaining cash in `currency`
  loaded: number; // total ever loaded
}

// A recorded payoff between two people to settle group balances.
export interface Settlement {
  id: string;
  tripId: string;
  fromId: string; // collaborator who paid
  toId: string; // collaborator who received
  amount: number; // in trip base currency
  createdAt: string;
}

export type DocumentType = 'passport' | 'id' | 'visa' | 'insurance' | 'other';

export interface TravelDocument {
  id: string;
  tripId: string | null; // null = lives in the global wallet
  type: DocumentType;
  title: string;
  fileUri?: string; // local URI in the prototype
  number?: string;
  expiryDate?: string; // ISO date
  sourceId?: string; // if auto-created from a flight/hotel, that record's id
  sourceTag?: string; // distinguishes multiple docs per source, e.g. 'booking' | 'boarding'
}

export type TodoCategory = 'todo' | 'packing' | 'shopping' | 'notes';

export interface TodoItem {
  id: string;
  tripId: string;
  title: string;
  category: TodoCategory;
  done: boolean;
}

export interface Flight {
  id: string;
  tripId: string;
  airline: string;
  departAt: string; // ISO datetime (date + time)
  price?: number; // in `currency`
  currency?: CurrencyCode;
  platform?: string; // where it was booked (e.g. MakeMyTrip, direct)
  bookingProofUri?: string;
  boardingPassUri?: string;
  // Optional route details (kept for seed data; the quick-add form omits them).
  flightNo?: string;
  fromCode?: string;
  toCode?: string;
  fromCity?: string;
  toCity?: string;
  arriveAt?: string; // ISO datetime
  seat?: string;
}

export interface Hotel {
  id: string;
  tripId: string;
  name: string;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  totalPrice?: number; // in `currency`
  currency?: CurrencyCode;
  platform?: string; // where it was booked (e.g. Booking.com, direct)
  proofUri?: string;
  // Optional extras (kept for seed data; the quick-add form omits them).
  address?: string;
  confirmationNo?: string;
  pricePerNight?: number;
}

// A planned/booked activity (tour, ticket, experience). Like flights/hotels it
// can carry a price, a booking platform and a ticket, and it flows into the
// trip's expenses, documents and itinerary.
export interface Activity {
  id: string;
  tripId: string;
  name: string;
  activityDate: string; // ISO date 'YYYY-MM-DD'
  time?: string; // 'HH:mm'
  location?: string;
  price?: number; // in `currency`
  currency?: CurrencyCode;
  platform?: string; // where it was booked (e.g. GetYourGuide, direct)
  bookingProofUri?: string; // ticket / confirmation
  notes?: string;
}

export type CollaboratorRole = 'owner' | 'editor';

// A person on a trip. Modelled as its own list keyed by tripId (like a
// `trip_collaborators` join table) so it maps cleanly onto Supabase later.
export interface Collaborator {
  id: string;
  tripId: string;
  name: string;
  email: string;
  avatarColor: string;
  role: CollaboratorRole;
  isMe?: boolean; // marks the current signed-in user's own row
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  baseCurrency: CurrencyCode;
  totalBudget: number;
  coverColor: string; // gradient seed for the cover
  coverImage?: string; // optional user-picked cover photo (local URI)
  emoji: string;
  completedAt?: string | null; // ISO timestamp — set when manually marked complete
}
