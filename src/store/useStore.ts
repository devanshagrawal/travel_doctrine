import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  BudgetCategory,
  Expense,
  Flight,
  Hotel,
  ItineraryItem,
  TodoItem,
  TravelDocument,
  Trip,
  User,
} from '../lib/types';
import { uid } from '../lib/format';
import {
  seedBudgetCategories,
  seedDocuments,
  seedExpenses,
  seedFlights,
  seedHotels,
  seedItinerary,
  seedTodos,
  seedTrips,
  seedUser,
} from '../data/seed';

// Default budget categories created for every new trip, so the budget
// breakdown and expense category picker are never empty.
const DEFAULT_CATEGORIES: Omit<BudgetCategory, 'id' | 'tripId'>[] = [
  { name: 'Flights', planned: 0, color: '#2563EB', icon: 'airplane' },
  { name: 'Stay', planned: 0, color: '#F97316', icon: 'bed' },
  { name: 'Food', planned: 0, color: '#16A34A', icon: 'restaurant' },
  { name: 'Transport', planned: 0, color: '#9333EA', icon: 'train' },
  { name: 'Activities', planned: 0, color: '#0EA5E9', icon: 'ticket' },
  { name: 'Shopping', planned: 0, color: '#E11D48', icon: 'bag-handle' },
];

interface AppState {
  // ---- auth ----
  isAuthed: boolean;
  user: User | null;
  hasHydrated: boolean;

  // ---- data ----
  trips: Trip[];
  budgetCategories: BudgetCategory[];
  expenses: Expense[];
  itinerary: ItineraryItem[];
  documents: TravelDocument[];
  flights: Flight[];
  hotels: Hotel[];
  todos: TodoItem[];

  // ---- auth actions ----
  login: (email: string) => void;
  loginAsDemo: () => void;
  signup: (fullName: string, email: string) => void;
  logout: () => void;
  setHomeCurrency: (code: string) => void;
  updateUser: (patch: Partial<User>) => void;

  // ---- trip actions ----
  addTrip: (t: Omit<Trip, 'id'>) => string;
  updateTrip: (id: string, patch: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;

  // ---- nested record actions ----
  addExpense: (e: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addBudgetCategory: (c: Omit<BudgetCategory, 'id'>) => void;
  addItineraryItem: (i: Omit<ItineraryItem, 'id'>) => void;
  deleteItineraryItem: (id: string) => void;
  addDocument: (d: Omit<TravelDocument, 'id'>) => void;
  deleteDocument: (id: string) => void;
  addFlight: (f: Omit<Flight, 'id'>) => string;
  updateFlight: (id: string, patch: Partial<Flight>) => void;
  deleteFlight: (id: string) => void;
  attachBoardingPass: (flightId: string, uri: string) => void;
  addHotel: (h: Omit<Hotel, 'id'>) => string;
  updateHotel: (id: string, patch: Partial<Hotel>) => void;
  deleteHotel: (id: string) => void;
  attachHotelProof: (hotelId: string, uri: string) => void;

  // ---- checklist ----
  addTodo: (t: Omit<TodoItem, 'id' | 'done'>) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;

  // ---- idempotent links (one record per flight/hotel source) ----
  syncSourceExpense: (p: Omit<Expense, 'id'> & { sourceId: string }) => void;
  syncSourceDocument: (p: Omit<TravelDocument, 'id'> & { sourceId: string; sourceTag: string }) => void;
  syncSourceItinerary: (p: Omit<ItineraryItem, 'id'> & { sourceId: string }) => void;

  resetToSeed: () => void;
}

const seedData = () => ({
  trips: seedTrips,
  budgetCategories: seedBudgetCategories,
  expenses: seedExpenses,
  itinerary: seedItinerary,
  documents: seedDocuments,
  flights: seedFlights,
  hotels: seedHotels,
  todos: seedTodos,
});

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthed: false,
      user: null,
      hasHydrated: false,
      ...seedData(),

      login: (email) =>
        set({ isAuthed: true, user: { ...seedUser, email: email || seedUser.email } }),
      loginAsDemo: () => set({ isAuthed: true, user: seedUser }),
      signup: (fullName, email) =>
        set({
          isAuthed: true,
          user: { ...seedUser, fullName: fullName || seedUser.fullName, email: email || seedUser.email },
        }),
      logout: () => set({ isAuthed: false, user: null }),
      setHomeCurrency: (code) =>
        set((s) => (s.user ? { user: { ...s.user, homeCurrency: code } } : {})),
      updateUser: (patch) =>
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : {})),

      addTrip: (t) => {
        const id = uid('trip');
        // Seed a default set of budget categories so budget/expenses aren't empty.
        const cats: BudgetCategory[] = DEFAULT_CATEGORIES.map((c) => ({ ...c, id: uid('bc'), tripId: id }));
        set((s) => ({ trips: [{ ...t, id }, ...s.trips], budgetCategories: [...s.budgetCategories, ...cats] }));
        return id;
      },
      updateTrip: (id, patch) =>
        set((s) => ({ trips: s.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTrip: (id) =>
        set((s) => ({
          trips: s.trips.filter((t) => t.id !== id),
          budgetCategories: s.budgetCategories.filter((x) => x.tripId !== id),
          expenses: s.expenses.filter((x) => x.tripId !== id),
          itinerary: s.itinerary.filter((x) => x.tripId !== id),
          documents: s.documents.filter((x) => x.tripId !== id),
          flights: s.flights.filter((x) => x.tripId !== id),
          hotels: s.hotels.filter((x) => x.tripId !== id),
        })),

      addExpense: (e) => set((s) => ({ expenses: [{ ...e, id: uid('e') }, ...s.expenses] })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),
      addBudgetCategory: (c) =>
        set((s) => ({ budgetCategories: [...s.budgetCategories, { ...c, id: uid('bc') }] })),
      addItineraryItem: (i) => set((s) => ({ itinerary: [...s.itinerary, { ...i, id: uid('it') }] })),
      deleteItineraryItem: (id) =>
        set((s) => ({ itinerary: s.itinerary.filter((x) => x.id !== id) })),
      addDocument: (d) => set((s) => ({ documents: [{ ...d, id: uid('doc') }, ...s.documents] })),
      deleteDocument: (id) => set((s) => ({ documents: s.documents.filter((x) => x.id !== id) })),
      addFlight: (f) => {
        const id = uid('fl');
        set((s) => ({ flights: [...s.flights, { ...f, id }] }));
        return id;
      },
      updateFlight: (id, patch) =>
        set((s) => ({ flights: s.flights.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      // Deleting a flight also removes the expense/document/itinerary items
      // that were auto-created from it (tagged with sourceId === flight id).
      deleteFlight: (id) =>
        set((s) => ({
          flights: s.flights.filter((f) => f.id !== id),
          expenses: s.expenses.filter((e) => e.sourceId !== id),
          documents: s.documents.filter((d) => d.sourceId !== id),
          itinerary: s.itinerary.filter((i) => i.sourceId !== id),
        })),
      attachBoardingPass: (flightId, uri) =>
        set((s) => ({
          flights: s.flights.map((f) => (f.id === flightId ? { ...f, boardingPassUri: uri } : f)),
        })),
      addHotel: (h) => {
        const id = uid('ht');
        set((s) => ({ hotels: [...s.hotels, { ...h, id }] }));
        return id;
      },
      updateHotel: (id, patch) =>
        set((s) => ({ hotels: s.hotels.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      deleteHotel: (id) =>
        set((s) => ({
          hotels: s.hotels.filter((h) => h.id !== id),
          expenses: s.expenses.filter((e) => e.sourceId !== id),
          documents: s.documents.filter((d) => d.sourceId !== id),
          itinerary: s.itinerary.filter((i) => i.sourceId !== id),
        })),
      attachHotelProof: (hotelId, uri) =>
        set((s) => ({
          hotels: s.hotels.map((h) => (h.id === hotelId ? { ...h, proofUri: uri } : h)),
        })),

      addTodo: (t) => set((s) => ({ todos: [...s.todos, { ...t, id: uid('todo'), done: false }] })),
      toggleTodo: (id) =>
        set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
      deleteTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),

      // Upsert exactly one expense for a flight/hotel. amount<=0 removes it.
      // Keeps the auto-created expense in sync when price is added/edited/cleared.
      syncSourceExpense: (p) =>
        set((s) => {
          const rest = s.expenses.filter((e) => e.sourceId !== p.sourceId);
          if (p.amount > 0) {
            const existing = s.expenses.find((e) => e.sourceId === p.sourceId);
            return { expenses: [{ ...p, id: existing?.id ?? uid('e') }, ...rest] };
          }
          return { expenses: rest };
        }),
      // Upsert one document per (sourceId, sourceTag). Empty fileUri removes it.
      syncSourceDocument: (p) =>
        set((s) => {
          const match = (d: TravelDocument) => d.sourceId === p.sourceId && d.sourceTag === p.sourceTag;
          const rest = s.documents.filter((d) => !match(d));
          if (p.fileUri) {
            const existing = s.documents.find(match);
            return { documents: [{ ...p, id: existing?.id ?? uid('doc') }, ...rest] };
          }
          return { documents: rest };
        }),
      // Upsert exactly one itinerary entry for a flight/hotel.
      syncSourceItinerary: (p) =>
        set((s) => {
          const existing = s.itinerary.find((i) => i.sourceId === p.sourceId);
          const rest = s.itinerary.filter((i) => i.sourceId !== p.sourceId);
          return { itinerary: [...rest, { ...p, id: existing?.id ?? uid('it') }] };
        }),

      resetToSeed: () => set({ ...seedData() }),
    }),
    {
      name: 'travel-assistant-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist the transient hydration flag.
      partialize: ({ hasHydrated, ...rest }) => rest as AppState,
      // Called once AsyncStorage has loaded (or errored). Flip the gate so
      // the UI can render instead of showing the splash forever.
      onRehydrateStorage: () => (state) => {
        // Backfill: any trip created before default-categories existed (or an
        // older persisted store) gets the default category set so the budget
        // and expense-category picker are never empty.
        if (state) {
          const missing = state.trips.filter(
            (t) => !state.budgetCategories.some((c) => c.tripId === t.id)
          );
          if (missing.length > 0) {
            const added: BudgetCategory[] = missing.flatMap((t) =>
              DEFAULT_CATEGORIES.map((c) => ({ ...c, id: uid('bc'), tripId: t.id }))
            );
            useStore.setState({ budgetCategories: [...state.budgetCategories, ...added] });
          }
        }
        useStore.setState({ hasHydrated: true, todos: state?.todos ?? [] });
      },
    }
  )
);

// Safety net: if hydration already completed before the callback wired up
// (or on web where it can be synchronous), make sure the gate opens.
if (useStore.persist.hasHydrated()) {
  useStore.setState({ hasHydrated: true });
}
