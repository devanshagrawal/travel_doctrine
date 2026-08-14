import {
  BudgetCategory,
  Collaborator,
  Expense,
  Flight,
  Hotel,
  ItineraryItem,
  TodoItem,
  TravelDocument,
  Trip,
  User,
} from '../lib/types';

// A demo user. In the mock build "login" just activates this user.
export const seedUser: User = {
  id: 'user_demo',
  fullName: 'Devansh Agrawal',
  email: 'devansh.agrawal1997@gmail.com',
  homeCurrency: 'INR',
  avatarColor: '#2563EB',
};

export const seedTrips: Trip[] = [
  {
    id: 'trip_japan',
    name: 'Japan Autumn Escape',
    destination: 'Tokyo & Kyoto, Japan',
    startDate: '2026-10-03',
    endDate: '2026-10-12',
    baseCurrency: 'JPY',
    totalBudget: 480000,
    coverColor: '#E11D48',
    emoji: '🗼',
  },
  {
    id: 'trip_bali',
    name: 'Bali Workation',
    destination: 'Ubud & Canggu, Indonesia',
    startDate: '2026-08-08',
    endDate: '2026-08-20',
    baseCurrency: 'USD',
    totalBudget: 2600,
    coverColor: '#0D9488',
    emoji: '🌴',
  },
  {
    id: 'trip_paris',
    name: 'Paris Long Weekend',
    destination: 'Paris, France',
    startDate: '2026-05-14',
    endDate: '2026-05-18',
    baseCurrency: 'EUR',
    totalBudget: 1800,
    coverColor: '#9333EA',
    emoji: '🗼',
  },
];

export const seedBudgetCategories: BudgetCategory[] = [
  // Japan
  { id: 'bc_j1', tripId: 'trip_japan', name: 'Flights', planned: 120000, color: '#2563EB', icon: 'airplane' },
  { id: 'bc_j2', tripId: 'trip_japan', name: 'Stay', planned: 140000, color: '#F97316', icon: 'bed' },
  { id: 'bc_j3', tripId: 'trip_japan', name: 'Food', planned: 80000, color: '#16A34A', icon: 'restaurant' },
  { id: 'bc_j4', tripId: 'trip_japan', name: 'Transport', planned: 50000, color: '#9333EA', icon: 'train' },
  { id: 'bc_j5', tripId: 'trip_japan', name: 'Activities', planned: 60000, color: '#0EA5E9', icon: 'ticket' },
  { id: 'bc_j6', tripId: 'trip_japan', name: 'Shopping', planned: 30000, color: '#E11D48', icon: 'bag-handle' },
  // Bali
  { id: 'bc_b1', tripId: 'trip_bali', name: 'Flights', planned: 700, color: '#2563EB', icon: 'airplane' },
  { id: 'bc_b2', tripId: 'trip_bali', name: 'Villa', planned: 900, color: '#F97316', icon: 'bed' },
  { id: 'bc_b3', tripId: 'trip_bali', name: 'Food', planned: 500, color: '#16A34A', icon: 'restaurant' },
  { id: 'bc_b4', tripId: 'trip_bali', name: 'Scooter', planned: 120, color: '#9333EA', icon: 'bicycle' },
  { id: 'bc_b5', tripId: 'trip_bali', name: 'Activities', planned: 380, color: '#0EA5E9', icon: 'ticket' },
  // Paris
  { id: 'bc_p1', tripId: 'trip_paris', name: 'Flights', planned: 420, color: '#2563EB', icon: 'airplane' },
  { id: 'bc_p2', tripId: 'trip_paris', name: 'Hotel', planned: 700, color: '#F97316', icon: 'bed' },
  { id: 'bc_p3', tripId: 'trip_paris', name: 'Food', planned: 400, color: '#16A34A', icon: 'restaurant' },
  { id: 'bc_p4', tripId: 'trip_paris', name: 'Museums', planned: 180, color: '#0EA5E9', icon: 'ticket' },
  { id: 'bc_p5', tripId: 'trip_paris', name: 'Metro', planned: 100, color: '#9333EA', icon: 'train' },
];

export const seedExpenses: Expense[] = [
  // Bali (ongoing) — partial spend
  { id: 'e_b1', tripId: 'trip_bali', categoryId: 'bc_b1', amount: 680, currency: 'USD', description: 'Round-trip flights', spentAt: '2026-07-20', paidBy: 'Me' },
  { id: 'e_b2', tripId: 'trip_bali', categoryId: 'bc_b2', amount: 540, currency: 'USD', description: 'Ubud villa (6 nights)', spentAt: '2026-08-08', paidBy: 'Me' },
  { id: 'e_b3', tripId: 'trip_bali', categoryId: 'bc_b3', amount: 42.5, currency: 'USD', description: 'Dinner at Locavore', spentAt: '2026-08-09', paidBy: 'Me' },
  { id: 'e_b4', tripId: 'trip_bali', categoryId: 'bc_b4', amount: 45, currency: 'USD', description: 'Scooter rental (12 days)', spentAt: '2026-08-09', paidBy: 'Me' },
  { id: 'e_b5', tripId: 'trip_bali', categoryId: 'bc_b5', amount: 90, currency: 'USD', description: 'Mount Batur sunrise trek', spentAt: '2026-08-11', paidBy: 'Me' },
  { id: 'e_b6', tripId: 'trip_bali', categoryId: 'bc_b3', amount: 18, currency: 'USD', description: 'Warung lunch x2', spentAt: '2026-08-11', paidBy: 'Me' },
  // Paris (past) — fully spent
  { id: 'e_p1', tripId: 'trip_paris', categoryId: 'bc_p1', amount: 410, currency: 'EUR', description: 'Flights CDG', spentAt: '2026-04-02', paidBy: 'Me' },
  { id: 'e_p2', tripId: 'trip_paris', categoryId: 'bc_p2', amount: 760, currency: 'EUR', description: 'Hotel Le Marais (4 nights)', spentAt: '2026-05-14', paidBy: 'Me' },
  { id: 'e_p3', tripId: 'trip_paris', categoryId: 'bc_p3', amount: 355, currency: 'EUR', description: 'Cafés & dinners', spentAt: '2026-05-16', paidBy: 'Me' },
  { id: 'e_p4', tripId: 'trip_paris', categoryId: 'bc_p4', amount: 210, currency: 'EUR', description: 'Louvre + Orsay', spentAt: '2026-05-15', paidBy: 'Me' },
  { id: 'e_p5', tripId: 'trip_paris', categoryId: 'bc_p5', amount: 88, currency: 'EUR', description: 'Metro pass', spentAt: '2026-05-14', paidBy: 'Me' },
  // Japan (upcoming) — a couple of pre-paid items
  { id: 'e_j1', tripId: 'trip_japan', categoryId: 'bc_j1', amount: 118500, currency: 'JPY', description: 'Flights NRT', spentAt: '2026-06-30', paidBy: 'Me' },
  { id: 'e_j2', tripId: 'trip_japan', categoryId: 'bc_j2', amount: 62000, currency: 'JPY', description: 'Kyoto ryokan deposit', spentAt: '2026-07-15', paidBy: 'Me' },
];

export const seedItinerary: ItineraryItem[] = [
  // Japan
  { id: 'it_j1', tripId: 'trip_japan', dayDate: '2026-10-03', time: '14:30', title: 'Arrive at Narita (NRT)', type: 'transport', location: 'Narita Airport' },
  { id: 'it_j2', tripId: 'trip_japan', dayDate: '2026-10-03', time: '18:00', title: 'Check in — Shinjuku hotel', type: 'stay', location: 'Shinjuku, Tokyo' },
  { id: 'it_j3', tripId: 'trip_japan', dayDate: '2026-10-04', time: '09:30', title: 'Senso-ji Temple & Asakusa', type: 'activity', location: 'Asakusa' },
  { id: 'it_j4', tripId: 'trip_japan', dayDate: '2026-10-04', time: '13:00', title: 'Sushi lunch at Tsukiji', type: 'food', location: 'Tsukiji Outer Market' },
  { id: 'it_j5', tripId: 'trip_japan', dayDate: '2026-10-06', time: '08:00', title: 'Shinkansen to Kyoto', type: 'transport', location: 'Tokyo Station' },
  { id: 'it_j6', tripId: 'trip_japan', dayDate: '2026-10-06', time: '15:00', title: 'Fushimi Inari shrine walk', type: 'activity', location: 'Fushimi Inari' },
  // Bali
  { id: 'it_b1', tripId: 'trip_bali', dayDate: '2026-08-08', time: '11:00', title: 'Arrive Denpasar (DPS)', type: 'transport', location: 'Ngurah Rai Airport' },
  { id: 'it_b2', tripId: 'trip_bali', dayDate: '2026-08-11', time: '03:30', title: 'Mount Batur sunrise trek', type: 'activity', location: 'Mount Batur' },
  { id: 'it_b3', tripId: 'trip_bali', dayDate: '2026-08-14', time: '10:00', title: 'Move to Canggu', type: 'stay', location: 'Canggu' },
];

export const seedDocuments: TravelDocument[] = [
  { id: 'doc_pp', tripId: null, type: 'passport', title: 'Passport', number: 'Z1234567', expiryDate: '2029-11-14' },
  { id: 'doc_id', tripId: null, type: 'id', title: 'Aadhaar Card', number: 'XXXX-XXXX-4821' },
  { id: 'doc_ins', tripId: null, type: 'insurance', title: 'Travel Insurance (Annual)', number: 'TI-99213', expiryDate: '2027-01-01' },
  { id: 'doc_jvisa', tripId: 'trip_japan', type: 'visa', title: 'Japan Tourist Visa', number: 'JP-2026-55231', expiryDate: '2026-12-01' },
];

export const seedFlights: Flight[] = [
  {
    id: 'fl_j1', tripId: 'trip_japan', airline: 'ANA', flightNo: 'NH828',
    fromCode: 'DEL', toCode: 'NRT', fromCity: 'New Delhi', toCity: 'Tokyo',
    departAt: '2026-10-03T04:30:00', arriveAt: '2026-10-03T14:30:00', seat: '32A',
  },
  {
    id: 'fl_b1', tripId: 'trip_bali', airline: 'Singapore Airlines', flightNo: 'SQ938',
    fromCode: 'DEL', toCode: 'DPS', fromCity: 'New Delhi', toCity: 'Denpasar',
    departAt: '2026-08-08T01:15:00', arriveAt: '2026-08-08T11:00:00', seat: '18C',
  },
  {
    id: 'fl_p1', tripId: 'trip_paris', airline: 'Air France', flightNo: 'AF225',
    fromCode: 'DEL', toCode: 'CDG', fromCity: 'New Delhi', toCity: 'Paris',
    departAt: '2026-05-14T02:40:00', arriveAt: '2026-05-14T07:20:00', seat: '21F',
  },
];

export const seedHotels: Hotel[] = [
  {
    id: 'ht_j1', tripId: 'trip_japan', name: 'Shinjuku Granbell Hotel',
    address: 'Kabukicho, Shinjuku, Tokyo', checkIn: '2026-10-03', checkOut: '2026-10-06',
    confirmationNo: 'GRB-88213', pricePerNight: 22000,
  },
  {
    id: 'ht_j2', tripId: 'trip_japan', name: 'Kyoto Ryokan Sakura',
    address: 'Gion, Kyoto', checkIn: '2026-10-06', checkOut: '2026-10-12',
    confirmationNo: 'RYK-40021', pricePerNight: 18500,
  },
  {
    id: 'ht_b1', tripId: 'trip_bali', name: 'Ubud Jungle Villa',
    address: 'Jl. Raya Sanggingan, Ubud', checkIn: '2026-08-08', checkOut: '2026-08-14',
    confirmationNo: 'AIRBNB-7781', pricePerNight: 90,
  },
];

export const seedCollaborators: Collaborator[] = [
  // The demo user owns every seed trip.
  { id: 'co_j_me', tripId: 'trip_japan', name: seedUser.fullName, email: seedUser.email, avatarColor: seedUser.avatarColor, role: 'owner', isMe: true },
  { id: 'co_j_1', tripId: 'trip_japan', name: 'Aisha Khan', email: 'aisha.khan@gmail.com', avatarColor: '#0D9488', role: 'editor' },
  { id: 'co_j_2', tripId: 'trip_japan', name: 'Rohan Mehta', email: 'rohan.m@outlook.com', avatarColor: '#9333EA', role: 'editor' },

  { id: 'co_b_me', tripId: 'trip_bali', name: seedUser.fullName, email: seedUser.email, avatarColor: seedUser.avatarColor, role: 'owner', isMe: true },
  { id: 'co_b_1', tripId: 'trip_bali', name: 'Sara Lin', email: 'sara.lin@gmail.com', avatarColor: '#E11D48', role: 'editor' },

  { id: 'co_p_me', tripId: 'trip_paris', name: seedUser.fullName, email: seedUser.email, avatarColor: seedUser.avatarColor, role: 'owner', isMe: true },
];

export const seedTodos: TodoItem[] = [
  // Japan
  { id: 'td_j1', tripId: 'trip_japan', title: 'JR Pass (activate on arrival)', category: 'todo', done: true },
  { id: 'td_j2', tripId: 'trip_japan', title: 'Pocket wifi / eSIM', category: 'todo', done: false },
  { id: 'td_j3', tripId: 'trip_japan', title: 'Warm jacket (autumn evenings)', category: 'packing', done: false },
  { id: 'td_j4', tripId: 'trip_japan', title: 'Universal power adapter', category: 'packing', done: true },
  { id: 'td_j5', tripId: 'trip_japan', title: 'Matcha & Kit-Kats for gifts', category: 'shopping', done: false },
  { id: 'td_j6', tripId: 'trip_japan', title: 'Carry cash — many places are cash-only', category: 'notes', done: false },
  // Bali
  { id: 'td_b1', tripId: 'trip_bali', title: 'Reef-safe sunscreen', category: 'packing', done: true },
  { id: 'td_b2', tripId: 'trip_bali', title: 'Mosquito repellent', category: 'packing', done: false },
  { id: 'td_b3', tripId: 'trip_bali', title: 'Book Nusa Penida day trip', category: 'todo', done: false },
];
