import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fetchLeaderboardPage } from "./requests";

// Unkeyed by Player: the Leaderboard is the same Season ranking for everyone, signed in or out.
export const worldKeys = {
  leaderboard: ["world", "leaderboard"] as const,
  leaderboardPage: (page: number) => [...worldKeys.leaderboard, page] as const,
};

export function useLeaderboardPage(page: number) {
  return useQuery({
    queryKey: worldKeys.leaderboardPage(page),
    queryFn: () => fetchLeaderboardPage(api, page),
  });
}
