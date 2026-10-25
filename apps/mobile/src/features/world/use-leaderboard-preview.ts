import type { AppCompetitionLeaderboardPageResponse } from "@mentis/contracts/app";
import { useQuery } from "@tanstack/react-query";
import { isCurrentSeason } from "@/features/competition/freshness";
import { useLeaderboardPage } from "@/features/world/api";
import { worldKeys } from "@/features/world/keys";
import { leaderboardPreview, previewNeighborPage } from "@/features/world/leaderboard-preview";
import { FIRST_PAGE } from "@/features/world/pager";
import { fetchLeaderboardPage } from "@/features/world/requests";
import { api } from "@/lib/api";
import { usableOnly } from "@/lib/query-client";

export function useLeaderboardPreview(page: number | null, myPseudo: string | null) {
  const leaderboard = useLeaderboardPage(page);
  const neighborPage =
    page !== null && leaderboard.data && !leaderboard.isPlaceholderData
      ? previewNeighborPage(leaderboard.data, myPseudo)
      : null;
  const neighbor = useQuery({
    queryKey: worldKeys.leaderboardPage(neighborPage ?? FIRST_PAGE),
    queryFn: () => fetchLeaderboardPage(api, neighborPage ?? FIRST_PAGE),
    enabled: neighborPage !== null,
    ...usableOnly<AppCompetitionLeaderboardPageResponse>(isCurrentSeason),
  });
  const adjacent =
    neighborPage !== null && neighbor.data?.season === leaderboard.data?.season
      ? (neighbor.data?.entries ?? [])
      : [];
  const current = leaderboard.data?.entries ?? [];
  const entries =
    neighborPage !== null && page !== null && neighborPage < page
      ? [...adjacent, ...current]
      : [...current, ...adjacent];

  return {
    entries: leaderboardPreview(entries, myPseudo),
    isPending: isAwaited(leaderboard) || (neighborPage !== null && isAwaited(neighbor)),
    isError: leaderboard.isError || (neighborPage !== null && neighbor.isError),
    refetch: () => {
      void leaderboard.refetch();
      if (neighborPage !== null) void neighbor.refetch();
    },
  };
}

// Data out of its Season reads as none, so a settled read without data still awaits its re-read.
function isAwaited(read: { data: unknown; isError: boolean }): boolean {
  return read.data === undefined && !read.isError;
}
