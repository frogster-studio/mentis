import type { AppAccountStatsResponse } from "@mentis/contracts/app";
import type { Category } from "@/types/quiz";

export type ThemeTally = AppAccountStatsResponse["themes"][number];

export type StatTiles = {
  practiceGames: number;
  // Null signed out: a device holds no competition record, so it knows no count rather than 0.
  competitionGames: number | null;
  overallAverage: number | null;
};

export type ThemeStatRow = {
  themeId: string;
  themeName: string;
  gameCount: number;
  best: number | null;
  average: number | null;
};

export type CategoryGroup = {
  category: Category;
  rows: ThemeStatRow[];
};

const frenchCollator = new Intl.Collator("fr", { sensitivity: "base" });

export function statTiles(tallies: ThemeTally[], isSignedIn: boolean): StatTiles {
  let practiceGames = 0;
  let competitionGames = 0;
  let scoredPoints = 0;
  let scoreCount = 0;
  for (const tally of tallies) {
    practiceGames += tally.practice.sessionCount;
    competitionGames += tally.competition.attemptCount;
    scoredPoints += scoredPointsOf(tally);
    scoreCount += scoreCountOf(tally);
  }
  return {
    practiceGames,
    competitionGames: isSignedIn ? competitionGames : null,
    overallAverage: roundedAverage(scoredPoints, scoreCount),
  };
}

export function themeStatRow(tally: ThemeTally): ThemeStatRow {
  const bests = [tally.practice.bestScore, tally.competition.bestScore].filter(
    (best) => best !== null,
  );
  return {
    themeId: tally.themeId,
    themeName: tally.themeName,
    gameCount: tally.practice.sessionCount + tally.competition.attemptCount,
    best: bests.length === 0 ? null : Math.max(...bests),
    average: roundedAverage(scoredPointsOf(tally), scoreCountOf(tally)),
  };
}

// A tally without a Category is left out here, yet still counted by the tiles.
export function categoryGroups(tallies: ThemeTally[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();
  for (const tally of tallies) {
    if (tally.category === null) {
      continue;
    }
    const group = groups.get(tally.category.id) ?? { category: tally.category, rows: [] };
    group.rows.push(themeStatRow(tally));
    groups.set(tally.category.id, group);
  }
  const sorted = [...groups.values()].sort((a, b) =>
    frenchCollator.compare(a.category.name, b.category.name),
  );
  for (const group of sorted) {
    group.rows.sort((a, b) => frenchCollator.compare(a.themeName, b.themeName));
  }
  return sorted;
}

// Unjudged Attempts hold no score, so only judged ones enter an average.
function scoredPointsOf(tally: ThemeTally): number {
  return tally.practice.totalPoints + tally.competition.totalPoints;
}

function scoreCountOf(tally: ThemeTally): number {
  return tally.practice.sessionCount + tally.competition.judgedCount;
}

// Math.round sends a half up on non-negative scores: 34.5 reads 35.
function roundedAverage(points: number, scoreCount: number): number | null {
  return scoreCount === 0 ? null : Math.round(points / scoreCount);
}
