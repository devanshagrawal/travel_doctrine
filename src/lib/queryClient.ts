import { QueryClient } from '@tanstack/react-query';

// One shared client for the whole app. Conservative defaults — data is
// refetched on mount but not on every window focus (noisy on web).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});
