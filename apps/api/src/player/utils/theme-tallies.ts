import { isDeadAttempt } from "../../competition/utils/competition-day";
import type { PracticeSum } from "../types/practice-sum";
import type { TalliedAttempt } from "../types/tallied-attempt";
import type { ThemeTally } from "../types/theme-tally";

const emptyTally = (themeId: string): ThemeTally => ({
  themeId,
  practice: { sessionCount: 0, totalPoints: 0, bestScore: null },
  competition: { attemptCount: 0, judgedCount: 0, totalPoints: 0, bestScore: null },
});

const higherBest = (best: number | null, score: number | null): number | null =>
  score === null ? best : Math.max(best ?? score, score);

// A dead Attempt reads as judged at 0 without being finalized, so the stats read writes nothing.
const judgedScore = (attempt: TalliedAttempt, today: string): number | null => {
  if (attempt.status === "finalized") {
    return attempt.score;
  }
  return isDeadAttempt(attempt.issuedAt, today) ? 0 : null;
};

export const themeTallies = (
  practiceSums: PracticeSum[],
  attempts: TalliedAttempt[],
  today: string,
): ThemeTally[] => {
  const tallies = new Map<string, ThemeTally>();
  const tallyOf = (themeId: string): ThemeTally => {
    const tally = tallies.get(themeId) ?? emptyTally(themeId);
    tallies.set(themeId, tally);
    return tally;
  };
  for (const sum of practiceSums) {
    const { practice } = tallyOf(sum.themeId);
    practice.sessionCount += sum.sessionCount;
    practice.totalPoints += sum.totalPoints;
    practice.bestScore = higherBest(practice.bestScore, sum.bestScore);
  }
  for (const attempt of attempts) {
    const { competition } = tallyOf(attempt.themeId);
    competition.attemptCount += 1;
    const score = judgedScore(attempt, today);
    if (score !== null) {
      competition.judgedCount += 1;
      competition.totalPoints += score;
      competition.bestScore = higherBest(competition.bestScore, score);
    }
  }
  return [...tallies.values()].filter(
    (tally) => tally.practice.sessionCount + tally.competition.attemptCount > 0,
  );
};
