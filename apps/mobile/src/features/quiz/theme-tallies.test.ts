import { describe, expect, it } from "vitest";
import type { Category } from "@/types/quiz";
import { categoryGroups, statTiles, type ThemeTally, themeStatRow } from "./theme-tallies";

const HISTOIRE: Category = {
  id: "histoire",
  name: "Histoire",
  color: "#8d6e63",
  secondaryColor: "#efebe9",
  icon: "castle",
};
const ECOLOGIE: Category = {
  id: "ecologie",
  name: "Écologie",
  color: "#2e7d32",
  secondaryColor: "#e8f5e9",
  icon: "park",
};

const NO_PRACTICE: ThemeTally["practice"] = { sessionCount: 0, totalPoints: 0, bestScore: null };
const NO_COMPETITION: ThemeTally["competition"] = {
  attemptCount: 0,
  judgedCount: 0,
  totalPoints: 0,
  bestScore: null,
};

function tally(
  themeId: string,
  category: Category | null,
  practice: ThemeTally["practice"],
  competition: ThemeTally["competition"],
): ThemeTally {
  return { themeId, themeName: themeId, category, practice, competition };
}

describe("statTiles", () => {
  it("counts every session and every Attempt issued, unjudged ones included", () => {
    const tallies = [
      tally("geo", ECOLOGIE, { sessionCount: 3, totalPoints: 90, bestScore: 40 }, NO_COMPETITION),
      tally("rome", HISTOIRE, NO_PRACTICE, {
        attemptCount: 2,
        judgedCount: 1,
        totalPoints: 20,
        bestScore: 20,
      }),
    ];
    expect(statTiles(tallies, true)).toMatchObject({ practiceGames: 3, competitionGames: 2 });
  });

  it("averages practice points and judged competition points together", () => {
    const tallies = [
      tally(
        "geo",
        ECOLOGIE,
        { sessionCount: 230, totalPoints: 8000, bestScore: 50 },
        {
          attemptCount: 12,
          judgedCount: 10,
          totalPoints: 400,
          bestScore: 45,
        },
      ),
    ];
    expect(statTiles(tallies, true).overallAverage).toBe(35);
  });

  it("sends a half up", () => {
    const tallies = [
      tally("geo", ECOLOGIE, { sessionCount: 2, totalPoints: 69, bestScore: 35 }, NO_COMPETITION),
    ];
    expect(statTiles(tallies, true).overallAverage).toBe(35);
  });

  it("holds no Overall Average while no score is held", () => {
    const tallies = [tally("rome", HISTOIRE, NO_PRACTICE, { ...NO_COMPETITION, attemptCount: 1 })];
    expect(statTiles(tallies, true)).toStrictEqual({
      practiceGames: 0,
      competitionGames: 1,
      overallAverage: null,
    });
  });

  it("is zero games and no average with no tally", () => {
    expect(statTiles([], true)).toStrictEqual({
      practiceGames: 0,
      competitionGames: 0,
      overallAverage: null,
    });
  });

  it("knows no competition count signed out, never 0", () => {
    const tallies = [
      tally("geo", ECOLOGIE, { sessionCount: 1, totalPoints: 30, bestScore: 30 }, NO_COMPETITION),
    ];
    expect(statTiles(tallies, false)).toStrictEqual({
      practiceGames: 1,
      competitionGames: null,
      overallAverage: 30,
    });
  });

  it("still counts a tally without a Category", () => {
    const tallies = [
      tally("gone", null, { sessionCount: 2, totalPoints: 60, bestScore: 40 }, NO_COMPETITION),
    ];
    expect(statTiles(tallies, true)).toStrictEqual({
      practiceGames: 2,
      competitionGames: 0,
      overallAverage: 30,
    });
  });
});

describe("themeStatRow", () => {
  it("counts sessions and Attempts, keeps the higher best and averages over judged scores", () => {
    const row = themeStatRow(
      tally(
        "geo",
        ECOLOGIE,
        { sessionCount: 3, totalPoints: 90, bestScore: 40 },
        {
          attemptCount: 2,
          judgedCount: 1,
          totalPoints: 45,
          bestScore: 45,
        },
      ),
    );
    expect(row).toStrictEqual({
      themeId: "geo",
      themeName: "geo",
      gameCount: 5,
      best: 45,
      average: 34,
    });
  });

  it("keeps the practice best when no Attempt is judged", () => {
    const row = themeStatRow(
      tally("geo", ECOLOGIE, { sessionCount: 1, totalPoints: 30, bestScore: 30 }, NO_COMPETITION),
    );
    expect(row.best).toBe(30);
  });

  it("knows no best when only totals without a best were recorded", () => {
    const row = themeStatRow(
      tally(
        "geo",
        ECOLOGIE,
        { sessionCount: 4, totalPoints: 100, bestScore: null },
        NO_COMPETITION,
      ),
    );
    expect(row).toMatchObject({ gameCount: 4, best: null, average: 25 });
  });

  it("reads 1, no best and no average for a lone unjudged Attempt", () => {
    const row = themeStatRow(
      tally("rome", HISTOIRE, NO_PRACTICE, { ...NO_COMPETITION, attemptCount: 1 }),
    );
    expect(row).toMatchObject({ gameCount: 1, best: null, average: null });
  });
});

describe("categoryGroups", () => {
  const played = { sessionCount: 1, totalPoints: 30, bestScore: 30 };

  it("is empty with no tally", () => {
    expect(categoryGroups([])).toStrictEqual([]);
  });

  it("orders Categories then Themes in French collation, blind to case and accents", () => {
    const tallies = [
      tally("Rome", HISTOIRE, played, NO_COMPETITION),
      tally("océans", ECOLOGIE, played, NO_COMPETITION),
      tally("Égypte", HISTOIRE, played, NO_COMPETITION),
      tally("forêts", ECOLOGIE, played, NO_COMPETITION),
      tally("athènes", HISTOIRE, played, NO_COMPETITION),
    ];
    const groups = categoryGroups(tallies);
    expect(groups.map((group) => group.category)).toStrictEqual([ECOLOGIE, HISTOIRE]);
    expect(groups.map((group) => group.rows.map((row) => row.themeName))).toStrictEqual([
      ["forêts", "océans"],
      ["athènes", "Égypte", "Rome"],
    ]);
  });

  it("leaves a tally without a Category out of the table", () => {
    const tallies = [
      tally("gone", null, played, NO_COMPETITION),
      tally("geo", ECOLOGIE, played, NO_COMPETITION),
    ];
    expect(categoryGroups(tallies)).toStrictEqual([
      { category: ECOLOGIE, rows: [themeStatRow(tallies[1])] },
    ]);
  });
});
