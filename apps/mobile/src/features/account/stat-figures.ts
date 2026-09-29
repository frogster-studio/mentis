import { STATS_MISSING_FIGURE, STATS_RANK_PREFIX } from "@/features/account/constants";
import { RESULTS_SCORE_MAX_LABEL } from "@/features/quiz/constants";

export function countFigure(count: number | null): string {
  return count === null ? STATS_MISSING_FIGURE : String(count);
}

export function scoreFigure(score: number | null): string {
  return score === null ? STATS_MISSING_FIGURE : `${score}${RESULTS_SCORE_MAX_LABEL}`;
}

export function rankFigure(rank: number | null): string {
  return rank === null ? STATS_MISSING_FIGURE : `${STATS_RANK_PREFIX}${rank}`;
}
