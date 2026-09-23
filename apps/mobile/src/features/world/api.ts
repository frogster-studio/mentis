import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FIRST_PAGE } from "./pager";
import { fetchLeaderboardPage } from "./requests";

// Unkeyed by Player: the Leaderboard is the same Season ranking for everyone, signed in or out.
export const worldKeys = {
  leaderboard: ["world", "leaderboard"] as const,
  leaderboardPage: (page: number) => [...worldKeys.leaderboard, page] as const,
};

// A null page holds the read until the Standing names the Player's own page.
export function useLeaderboardPage(page: number | null) {
  return useQuery({
    queryKey: worldKeys.leaderboardPage(page ?? FIRST_PAGE),
    queryFn: page === null ? skipToken : () => fetchLeaderboardPage(api, page),
    // Turning a page keeps the previous one on screen, so the pager never gives way to a loader.
    placeholderData: keepPreviousData,
  });
}
