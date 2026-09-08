import { appAccountStatsResponseSchema } from "@mentis/contracts/app";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchProfile, setPseudo } from "@/features/account/requests";
import { api } from "@/lib/api";
import { ACCOUNT_QUERY_ROOT, queryClient } from "@/lib/query-client";

// Keyed by Player id so one Player's shelf never bleeds into another's; the wire ignores the id.
export const accountKeys = {
  stats: (playerId: string) => [ACCOUNT_QUERY_ROOT, "stats", playerId] as const,
  profile: (playerId: string) => [ACCOUNT_QUERY_ROOT, "profile", playerId] as const,
};

// Sessions arrive oldest-first, so the fold's last-name-wins yields the freshest Theme name.
export function useAccountStats(playerId: string | undefined) {
  return useQuery({
    queryKey: accountKeys.stats(playerId ?? ""),
    queryFn: () =>
      api.requestJson({ method: "GET", path: "/app/me/stats" }, appAccountStatsResponseSchema),
    enabled: playerId !== undefined,
  });
}

// Under the persisted root: the pseudo names the Player in the header, offline launch included.
export function useProfile(playerId: string | undefined) {
  return useQuery({
    queryKey: accountKeys.profile(playerId ?? ""),
    queryFn: () => fetchProfile(api),
    enabled: playerId !== undefined,
  });
}

export function useSetPseudo(playerId: string) {
  return useMutation({
    mutationFn: (pseudo: string) => setPseudo(api, pseudo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.profile(playerId) }),
  });
}
