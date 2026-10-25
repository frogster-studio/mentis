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
  const awaited = [leaderboard, ...(neighborPage === null ? [] : [neighbor])].filter(
    (read) => read.data === undefined,
  );
  const failed = awaited.filter((read) => read.isError);

  return {
    // Data out of its Season reads as none, so a settled read without data still leaves no preview.
    entries: awaited.length === 0 ? leaderboardPreview(entries, myPseudo) : null,
    isFrozen: failed.length > 0,
    refetch: () => {
      for (const read of failed) void read.refetch();
    },
  };
}
