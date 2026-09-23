import type {
  AppCompetitionLeaderboardPageResponse,
  AppCompetitionStandingResponse,
} from "@mentis/contracts/app";
import { clampPage, FIRST_PAGE } from "./pager";

export function leaderboardPreview(
  entries: AppCompetitionLeaderboardPageResponse["entries"],
  myPseudo: string | null,
) {
  const position = entries.findIndex((entry) => entry.pseudo === myPseudo);
  const start = Math.max(0, Math.min(position - 1, entries.length - 3));
  return entries.slice(start, start + 3);
}

// The preview opens on the Player's own page, so it waits for the Standing instead of guessing page 1.
export function previewPage(
  owner: string | undefined,
  standing: { data: AppCompetitionStandingResponse | undefined; isError: boolean },
): number | null {
  if (owner === undefined) return FIRST_PAGE;
  if (standing.data) return standing.data.page ?? FIRST_PAGE;
  return standing.isError ? FIRST_PAGE : null;
}

export function previewNeighborPage(
  leaderboard: AppCompetitionLeaderboardPageResponse,
  myPseudo: string | null,
): number | null {
  const inRange = clampPage(leaderboard.page, leaderboard.pageCount);
  if (inRange !== leaderboard.page) return inRange;
  const position = leaderboard.entries.findIndex((entry) => entry.pseudo === myPseudo);
  if (position === -1) return null;
  if (position === 0 && leaderboard.page > 1) return leaderboard.page - 1;
  if (position >= leaderboard.entries.length - 2 && leaderboard.page < leaderboard.pageCount) {
    return leaderboard.page + 1;
  }
  return null;
}
