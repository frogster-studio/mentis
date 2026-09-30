import {
  DURATION_MINUTE_UNIT,
  DURATION_SECOND_UNIT,
  STATS_MISSING_FIGURE,
  STATS_RANK_PREFIX,
} from "@/features/account/constants";
import { RESULTS_SCORE_MAX_LABEL } from "@/features/quiz/constants";

export function countFigure(count: number | null): string {
  return count === null ? STATS_MISSING_FIGURE : String(count);
}

export function scoreFigure(score: number | null): string[] {
  return score === null ? [STATS_MISSING_FIGURE] : [String(score), RESULTS_SCORE_MAX_LABEL];
}

export function rankFigure(rank: number | null): string {
  return rank === null ? STATS_MISSING_FIGURE : `${STATS_RANK_PREFIX}${rank}`;
}

export function durationFigure(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const minutePart = `${minutes} ${DURATION_MINUTE_UNIT}`;
  const secondPart = `${seconds} ${DURATION_SECOND_UNIT}`;
  if (minutes === 0) {
    return secondPart;
  }
  return seconds === 0 ? minutePart : `${minutePart} ${secondPart}`;
}
