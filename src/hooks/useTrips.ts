import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trip } from '../lib/types';
import * as trips from '../repos/trips';

export const tripKeys = {
  all: ['trips'] as const,
  detail: (id: string) => ['trips', id] as const,
};

export function useTrips() {
  return useQuery({ queryKey: tripKeys.all, queryFn: trips.listTrips });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: () => trips.getTrip(id),
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Trip, 'id'>) => trips.createTrip(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Trip> }) => trips.updateTrip(id, patch),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: tripKeys.all });
      qc.invalidateQueries({ queryKey: tripKeys.detail(id) });
    },
  });
}

export function useSetTripCompleted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      trips.setTripCompleted(id, completed),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: tripKeys.all });
      qc.invalidateQueries({ queryKey: tripKeys.detail(id) });
    },
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trips.deleteTrip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
}
