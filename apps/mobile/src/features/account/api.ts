import { appAccountStatsResponseSchema } from "@mentis/contracts/app";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { fetchHistoryPage, fetchProfile, setPseudo } from "@/features/account/requests";
import { api } from "@/lib/api";
import { ACCOUNT_QUERY_ROOT, LONG_STALE_TIME_MS, queryClient } from "@/lib/query-client";

// Keyed by Player id so one Player's stats never bleed into another's; the wire ignores the id.
export const accountKeys = {
  stats: (playerId: string) => [ACCOUNT_QUERY_ROOT, "stats", playerId] as const,
  profile: (playerId: string) => [ACCOUNT_QUERY_ROOT, "profile", playerId] as const,
  history: (playerId: string) => [ACCOUNT_QUERY_ROOT, "history", playerId] as const,
};

export function useAccountStats(playerId: string | undefined) {
  return useQuery({
    queryKey: accountKeys.stats(playerId ?? ""),
    queryFn: () =>
      api.requestJson({ method: "GET", path: "/app/me/stats" }, appAccountStatsResponseSchema),
    enabled: playerId !== undefined,
  });
}

// Under the persisted root, every loaded page reads offline; the acks invalidate it, never a local line.
export function useHistory(playerId: string | undefined) {
  return useInfiniteQuery({
    queryKey: accountKeys.history(playerId ?? ""),
    queryFn: ({ pageParam }) => fetchHistoryPage(api, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextBefore ?? undefined,
    enabled: playerId !== undefined,
  });
}

// Under the persisted root: the pseudo names the Player in the header, offline launch included.
export function useProfile(playerId: string | undefined) {
  return useQuery({
    queryKey: accountKeys.profile(playerId ?? ""),
    queryFn: () => fetchProfile(api),
    enabled: playerId !== undefined,
    staleTime: LONG_STALE_TIME_MS,
  });
}

export function useSetPseudo(playerId: string) {
  return useMutation({
    mutationFn: (pseudo: string) => setPseudo(api, pseudo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.profile(playerId) }),
  });
}
