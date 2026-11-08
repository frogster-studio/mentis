import type { AppCompetitionAttemptKind } from "@mentis/contracts/app";

export const competitionKeys = {
  attempts: (playerId: string) => ["competition", "attempt", playerId] as const,
  attempt: (playerId: string, kind: AppCompetitionAttemptKind) =>
    [...competitionKeys.attempts(playerId), kind] as const,
  days: ["competition", "day"] as const,
  day: (playerId: string) => [...competitionKeys.days, playerId] as const,
  standings: ["competition", "standing"] as const,
  standing: (playerId: string) => [...competitionKeys.standings, playerId] as const,
  transcripts: ["competition", "transcript"] as const,
  transcript: (attemptId: string) => [...competitionKeys.transcripts, attemptId] as const,
};
