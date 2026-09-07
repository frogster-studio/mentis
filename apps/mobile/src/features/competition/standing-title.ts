import type { AppCompetitionStandingResponse } from "@mentis/contracts/app";
import { POINTS_UNIT } from "@/features/quiz/constants";
import { STANDING_FIRST_RANK_SUFFIX, STANDING_RANK_OF, STANDING_RANK_SUFFIX } from "./constants";

export function formatRank(rank: number): string {
  return `${rank}${rank === 1 ? STANDING_FIRST_RANK_SUFFIX : STANDING_RANK_SUFFIX}`;
}

// Null while the Season says nothing about the Player — signed out, unranked, loading or failed.
export function standingTitle(standing: AppCompetitionStandingResponse | undefined): string | null {
  if (standing === undefined || standing.rank === null) {
    return null;
  }
  const position = `${formatRank(standing.rank)} ${STANDING_RANK_OF} ${standing.rankedCount}`;
  return `${position} · ${standing.seasonTotal} ${POINTS_UNIT}`;
}
