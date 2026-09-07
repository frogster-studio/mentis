import { describe, expect, it } from "vitest";
import {
  leaderboardPage,
  leaderboardPageCount,
  positionFromRank,
  rankFromGreaterCount,
} from "../utils/leaderboard";

describe("Leaderboard rank and position", () => {
  const rows = [
    { total: 10, pseudoKey: "bravo" },
    { total: 5, pseudoKey: "alpha" },
    { total: 10, pseudoKey: "charlie" },
  ];

  it("shares ranks for equal totals without closing the gap after a tie", () => {
    expect(
      rows.map((mine) => rankFromGreaterCount(rows.filter((row) => row.total > mine.total).length)),
    ).toEqual([1, 3, 1]);
  });

  it("orders positions by total first, then pseudo key", () => {
    expect(
      rows.map((mine) =>
        positionFromRank(
          rankFromGreaterCount(rows.filter((row) => row.total > mine.total).length),
          rows.filter((row) => row.total === mine.total && row.pseudoKey < mine.pseudoKey).length,
        ),
      ),
    ).toEqual([1, 3, 2]);
  });

  it("ranks the first finalized zero total", () => {
    expect(rankFromGreaterCount(0)).toBe(1);
    expect(positionFromRank(1, 0)).toBe(1);
  });
});

describe("Leaderboard pages", () => {
  it.each([
    [1, 1],
    [50, 1],
    [51, 2],
    [100, 2],
    [101, 3],
  ])("places position %i on page %i", (position, page) => {
    expect(leaderboardPage(position)).toBe(page);
  });

  it.each([
    [0, 0],
    [1, 1],
    [50, 1],
    [51, 2],
    [100, 2],
  ])("counts %i ranked Accounts as %i pages", (rankedCount, pageCount) => {
    expect(leaderboardPageCount(rankedCount)).toBe(pageCount);
  });
});
