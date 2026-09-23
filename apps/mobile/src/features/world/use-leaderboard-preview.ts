import { useQuery } from "@tanstack/react-query";
import { useLeaderboardPage, worldKeys } from "@/features/world/api";
import { leaderboardPreview, previewNeighborPage } from "@/features/world/leaderboard-preview";
import { FIRST_PAGE } from "@/features/world/pager";
import { fetchLeaderboardPage } from "@/features/world/requests";
import { api } from "@/lib/api";

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
    isPending: leaderboard.isPending || (neighborPage !== null && neighbor.isPending),
    isError: leaderboard.isError || (neighborPage !== null && neighbor.isError),
    refetch: () => {
      void leaderboard.refetch();
      if (neighborPage !== null) void neighbor.refetch();
    },
  };
}
