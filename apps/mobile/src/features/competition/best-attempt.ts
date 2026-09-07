import type { AppCompetitionDayAttempt } from "@mentis/contracts/app";

// A day scores its best Attempt; on a tie the first issued stands, so the initial leads.
export function bestAttempt(
  attempts: AppCompetitionDayAttempt[],
): AppCompetitionDayAttempt | undefined {
  return attempts.reduce<AppCompetitionDayAttempt | undefined>(
    (best, attempt) => (best !== undefined && best.score >= attempt.score ? best : attempt),
    undefined,
  );
}
