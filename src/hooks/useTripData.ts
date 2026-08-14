import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Expense, ItineraryItem, Settlement, TodoItem } from '../lib/types';
import * as budget from '../repos/budget';
import * as expensesRepo from '../repos/expenses';
import * as cash from '../repos/cash';
import * as settlementsRepo from '../repos/settlements';
import * as members from '../repos/members';
import * as itineraryRepo from '../repos/itinerary';
import * as todosRepo from '../repos/todos';

export const keys = {
  categories: (tripId: string) => ['categories', tripId] as const,
  expenses: (tripId: string) => ['expenses', tripId] as const,
  wallets: (tripId: string) => ['wallets', tripId] as const,
  settlements: (tripId: string) => ['settlements', tripId] as const,
  members: (tripId: string) => ['members', tripId] as const,
  itinerary: (tripId: string) => ['itinerary', tripId] as const,
  todos: (tripId: string) => ['todos', tripId] as const,
};

// ---- queries ----
export function useBudgetCategories(tripId: string) {
  return useQuery({ queryKey: keys.categories(tripId), queryFn: () => budget.listCategories(tripId), enabled: !!tripId });
}
export function useExpenses(tripId: string) {
  return useQuery({ queryKey: keys.expenses(tripId), queryFn: () => expensesRepo.listExpenses(tripId), enabled: !!tripId });
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

// ---- mutations ----
export function useAddExpense(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Expense, 'id'>) => expensesRepo.addExpense(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.expenses(tripId) }),
  });
}
export function useDeleteExpense(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesRepo.deleteExpense(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.expenses(tripId) }),
  });
}
export function useLoadCash(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ currency, amount }: { currency: string; amount: number }) => cash.loadCash(tripId, currency, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.wallets(tripId) });
      qc.invalidateQueries({ queryKey: keys.expenses(tripId) });
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
