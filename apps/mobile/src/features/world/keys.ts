// Unkeyed by Player: the Leaderboard is the same Season ranking for everyone, signed in or out.
export const worldKeys = {
  leaderboard: ["world", "leaderboard"] as const,
  leaderboardPage: (page: number) => [...worldKeys.leaderboard, page] as const,
};
