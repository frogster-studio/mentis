import { LEADERBOARD_PAGE_SIZE } from "@mentis/contracts/app";

export const rankFromGreaterCount = (greaterCount: number): number => 1 + greaterCount;

export const positionFromRank = (rank: number, precedingTieCount: number): number =>
  rank + precedingTieCount;

export const leaderboardPage = (position: number): number =>
  Math.ceil(position / LEADERBOARD_PAGE_SIZE);

export const leaderboardPageCount = (rankedCount: number): number =>
  Math.ceil(rankedCount / LEADERBOARD_PAGE_SIZE);
