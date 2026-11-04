import type { AppCompetitionLeaderboardPageResponse } from "@mentis/contracts/app";
import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import { isCurrentSeason } from "@/features/competition/freshness";
import { api } from "@/lib/api";
import { usableOnly } from "@/lib/query-client";
import { worldKeys } from "./keys";
import { FIRST_PAGE } from "./pager";
import { fetchLeaderboardPage } from "./requests";

// A null page holds the read until the Standing names the Player's own page.
export function useLeaderboardPage(page: number | null) {
  return useQuery({
    queryKey: worldKeys.leaderboardPage(page ?? FIRST_PAGE),
    queryFn: page === null ? skipToken : () => fetchLeaderboardPage(api, page),
    // Turning a page keeps the previous one on screen, so the pager never gives way to a loader.
    placeholderData: keepPreviousData,
    ...usableOnly<AppCompetitionLeaderboardPageResponse>(isCurrentSeason),
  });
}
