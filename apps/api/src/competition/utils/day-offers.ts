import type { DayAttempt } from "../types/day-attempt";

// Offered once the initial is judged, and kept while the Replay itself is still in play.
export const offersReplay = (todays: DayAttempt[]): boolean => {
  const initial = todays.find((attempt) => attempt.kind === "initial");
  const replay = todays.find((attempt) => attempt.kind === "replay");
  return initial?.status === "finalized" && (replay === undefined || replay.status === "active");
};

// Offered for an empty yesterday of the same season, and kept while the Catch-up is still in play.
export const offersCatchUp = (yesterdays: DayAttempt[], sameSeason: boolean): boolean =>
  sameSeason &&
  yesterdays.every((attempt) => attempt.kind === "catchup" && attempt.status === "active");
