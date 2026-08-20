import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Expense, ItineraryItem, Settlement, TodoItem, TravelDocument } from '../lib/types';
import * as budget from '../repos/budget';
import * as expensesRepo from '../repos/expenses';
import * as cash from '../repos/cash';
import * as settlementsRepo from '../repos/settlements';
import * as members from '../repos/members';
import * as itineraryRepo from '../repos/itinerary';
import * as todosRepo from '../repos/todos';
import * as flightsRepo from '../repos/flights';
import * as hotelsRepo from '../repos/hotels';
import * as activitiesRepo from '../repos/activities';
import * as documentsRepo from '../repos/documents';
import { Flight, Hotel, Activity } from '../lib/types';

export const keys = {
  categories: (tripId: string) => ['categories', tripId] as const,
  expenses: (tripId: string) => ['expenses', tripId] as const,
  wallets: (tripId: string) => ['wallets', tripId] as const,
  settlements: (tripId: string) => ['settlements', tripId] as const,
  members: (tripId: string) => ['members', tripId] as const,
  allExpenses: ['expenses', 'all'] as const,
  itinerary: (tripId: string) => ['itinerary', tripId] as const,
  todos: (tripId: string) => ['todos', tripId] as const,
  flights: (tripId: string) => ['flights', tripId] as const,
  hotels: (tripId: string) => ['hotels', tripId] as const,
  activities: (tripId: string) => ['activities', tripId] as const,
  documents: (tripId: string | null) => ['documents', tripId ?? 'global'] as const,
};

// ---- queries ----
export function useBudgetCategories(tripId: string) {
  return useQuery({ queryKey: keys.categories(tripId), queryFn: () => budget.listCategories(tripId), enabled: !!tripId });
}
export function useExpenses(tripId: string) {
  return useQuery({ queryKey: keys.expenses(tripId), queryFn: () => expensesRepo.listExpenses(tripId), enabled: !!tripId });
}
export function useAllExpenses() {
  return useQuery({ queryKey: keys.allExpenses, queryFn: () => expensesRepo.listAllExpenses() });
}
export function useCashWallets(tripId: string) {
  return useQuery({ queryKey: keys.wallets(tripId), queryFn: () => cash.listWallets(tripId), enabled: !!tripId });
}
export function useSettlements(tripId: string) {
  return useQuery({ queryKey: keys.settlements(tripId), queryFn: () => settlementsRepo.listSettlements(tripId), enabled: !!tripId });
}
export function useMembers(tripId: string) {
  return useQuery({ queryKey: keys.members(tripId), queryFn: () => members.listMembers(tripId), enabled: !!tripId });
}
export function useInviteMember(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, email }: { name: string; email: string }) => members.inviteMember(tripId, name, email),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.members(tripId) }),
  });
}
export function useRemoveMember(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => members.removeMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.members(tripId) }),
  });
}

// ---- mutations ----
export function useAddExpense(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Expense, 'id'>) => expensesRepo.addExpense(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.expenses(tripId) });
      qc.invalidateQueries({ queryKey: keys.allExpenses });
    },
  });
}
export function useDeleteExpense(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesRepo.deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.expenses(tripId) });
      qc.invalidateQueries({ queryKey: keys.allExpenses });
    },
  });
}
export function useLoadCash(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ currency, amount }: { currency: string; amount: number }) => cash.loadCash(tripId, currency, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.wallets(tripId) });
      qc.invalidateQueries({ queryKey: keys.expenses(tripId) });
      qc.invalidateQueries({ queryKey: keys.allExpenses });
    },
  });
}
export function useAdjustCash(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ walletId, delta }: { walletId: string; delta: number }) => cash.adjustCash(walletId, delta),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.wallets(tripId) }),
  });
}
export function useAddSettlement(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Settlement, 'id' | 'createdAt'>) => settlementsRepo.addSettlement(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.settlements(tripId) }),
  });
}

// ---- itinerary ----
export function useItinerary(tripId: string) {
  return useQuery({ queryKey: keys.itinerary(tripId), queryFn: () => itineraryRepo.listItinerary(tripId), enabled: !!tripId });
}
export function useAddItineraryItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<ItineraryItem, 'id'>) => itineraryRepo.addItineraryItem(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.itinerary(tripId) }),
  });
}
export function useDeleteItineraryItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itineraryRepo.deleteItineraryItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.itinerary(tripId) }),
  });
}

// ---- checklist / todos ----
export function useTodos(tripId: string) {
  return useQuery({ queryKey: keys.todos(tripId), queryFn: () => todosRepo.listTodos(tripId), enabled: !!tripId });
}
export function useAddTodo(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<TodoItem, 'id' | 'done'>) => todosRepo.addTodo(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.todos(tripId) }),
  });
}
export function useSetTodoDone(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => todosRepo.setTodoDone(id, done),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.todos(tripId) }),
  });
}
export function useDeleteTodo(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => todosRepo.deleteTodo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.todos(tripId) }),
  });
}

// Flights/hotels changes ripple into the linked expense, documents and
// itinerary entry, so refresh all four caches on success.
function invalidateBookingLinked(qc: ReturnType<typeof useQueryClient>, tripId: string) {
  qc.invalidateQueries({ queryKey: keys.expenses(tripId) });
  qc.invalidateQueries({ queryKey: keys.allExpenses });
  qc.invalidateQueries({ queryKey: keys.documents(tripId) });
  qc.invalidateQueries({ queryKey: keys.itinerary(tripId) });
}

// ---- flights ----
export function useFlights(tripId: string) {
  return useQuery({ queryKey: keys.flights(tripId), queryFn: () => flightsRepo.listFlights(tripId), enabled: !!tripId });
}
export function useSaveFlight(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: flightsRepo.SaveFlightInput) => flightsRepo.saveFlight(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.flights(tripId) }); invalidateBookingLinked(qc, tripId); },
  });
}
export function useAttachBoardingPass(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ flight, uri }: { flight: Flight; uri: string }) => flightsRepo.attachBoardingPass(flight, uri),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.flights(tripId) }); invalidateBookingLinked(qc, tripId); },
  });
}
export function useDeleteFlight(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flightsRepo.deleteFlight(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.flights(tripId) }); invalidateBookingLinked(qc, tripId); },
  });
}

// ---- hotels ----
export function useHotels(tripId: string) {
  return useQuery({ queryKey: keys.hotels(tripId), queryFn: () => hotelsRepo.listHotels(tripId), enabled: !!tripId });
}
export function useSaveHotel(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: hotelsRepo.SaveHotelInput) => hotelsRepo.saveHotel(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.hotels(tripId) }); invalidateBookingLinked(qc, tripId); },
  });
}
export function useAttachHotelProof(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hotel, uri }: { hotel: Hotel; uri: string }) => hotelsRepo.attachHotelProof(hotel, uri),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.hotels(tripId) }); invalidateBookingLinked(qc, tripId); },
  });
}
export function useDeleteHotel(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hotelsRepo.deleteHotel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.hotels(tripId) }); invalidateBookingLinked(qc, tripId); },
  });
}

// ---- activities ----
export function useActivities(tripId: string) {
  return useQuery({ queryKey: keys.activities(tripId), queryFn: () => activitiesRepo.listActivities(tripId), enabled: !!tripId });
}
export function useSaveActivity(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: activitiesRepo.SaveActivityInput) => activitiesRepo.saveActivity(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.activities(tripId) }); invalidateBookingLinked(qc, tripId); },
  });
}
export function useAttachTicket(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ activity, uri }: { activity: Activity; uri: string }) => activitiesRepo.attachTicket(activity, uri),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.activities(tripId) }); invalidateBookingLinked(qc, tripId); },
  });
}
export function useDeleteActivity(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activitiesRepo.deleteActivity(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.activities(tripId) }); invalidateBookingLinked(qc, tripId); },
  });
}

// ---- documents (tripId null = global wallet) ----
export function useDocuments(tripId: string | null) {
  return useQuery({ queryKey: keys.documents(tripId), queryFn: () => documentsRepo.listDocuments(tripId) });
}
export function useAddDocument(tripId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<TravelDocument, 'id'>) => documentsRepo.addDocument(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.documents(tripId) }),
  });
}
export function useDeleteDocument(tripId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsRepo.deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.documents(tripId) }),
  });
}
