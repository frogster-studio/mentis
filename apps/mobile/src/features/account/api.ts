import { appAccountStatsResponseSchema } from "@mentis/contracts/app";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ACCOUNT_QUERY_ROOT } from "@/lib/query-client";

// Keyed by the Player's id so signing in — or switching to another Account on the same device — is a
// fresh cache entry: one Player's shelf never bleeds into another's. The id scopes nothing on the
// wire (the API derives that from the token); it isolates persisted cache entries. Built under
// ACCOUNT_QUERY_ROOT, the single marker the offline persister dehydrates (see query-client).
export const accountKeys = {
  stats: (playerId: string) => [ACCOUNT_QUERY_ROOT, "stats", playerId] as const,
};

// Pulls the Player's whole Account world in one guarded read: baselines plus every synced session,
// oldest-first so the fold's last-name-wins yields the most recently captured Theme name. Enabled
// only while signed in: the id in the key makes React Query refetch at sign-in, refetchOnMount
// covers launch, and AppState foreground (wired in query-client) covers the foreground pull. When
// disabled, the home shelf falls back to Device Stats.
export function useAccountStats(playerId: string | undefined) {
  return useQuery({
    queryKey: accountKeys.stats(playerId ?? ""),
    queryFn: () =>
      api.requestJson({ method: "GET", path: "/app/me/stats" }, appAccountStatsResponseSchema),
    enabled: playerId !== undefined,
  });
}
