import type {
  AppCompetitionDayResponse,
  AppCompetitionLeaderboardPageResponse,
  AppCompetitionTranscriptResponse,
} from "@mentis/contracts/app";
import { partialMatchKey, type QueryKey, type QueryStatus } from "@tanstack/react-query";
import { isCurrentSeason } from "@/features/competition/freshness";
import { competitionKeys } from "@/features/competition/keys";
import { worldKeys } from "@/features/world/keys";

// Every read under this root persists, so a signed-in offline launch still renders the last-known shelf.
export const ACCOUNT_QUERY_ROOT = "account";

interface PersistCandidate {
  queryKey: QueryKey;
  state: { status: QueryStatus; data: unknown };
}

// The Compétition tab renders its last-known reads on the first frame; issuance stays in memory.
export function shouldPersistQuery(
  { queryKey, state }: PersistCandidate,
  cachedDays: () => readonly AppCompetitionDayResponse[],
  now: Date,
): boolean {
  if (state.status !== "success") {
    return false;
  }
  if (
    partialMatchKey(queryKey, [ACCOUNT_QUERY_ROOT]) ||
    partialMatchKey(queryKey, competitionKeys.days) ||
    partialMatchKey(queryKey, competitionKeys.standings)
  ) {
    return true;
  }
  if (partialMatchKey(queryKey, worldKeys.leaderboard)) {
    return isCurrentSeason(state.data as AppCompetitionLeaderboardPageResponse, now);
  }
  if (partialMatchKey(queryKey, competitionKeys.transcripts)) {
    const attemptId = (state.data as AppCompetitionTranscriptResponse).id;
    return cachedDays().some((day) => day.attempts.some((attempt) => attempt.id === attemptId));
  }
  return false;
}
