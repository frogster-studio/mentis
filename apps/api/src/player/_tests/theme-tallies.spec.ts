import { describe, expect, it } from "vitest";
import type { PracticeSum } from "../types/practice-sum";
import type { TalliedAttempt } from "../types/tallied-attempt";
import { themeTallies } from "../utils/theme-tallies";

const THEME = "theme-a";
const TODAY = "2026-08-20";
const ISSUED_TODAY = new Date("2026-08-20T08:00:00.000Z");
const ISSUED_YESTERDAY = new Date("2026-08-19T08:00:00.000Z");

const sum = (sessionCount: number, totalPoints: number, bestScore: number | null): PracticeSum => ({
  themeId: THEME,
  sessionCount,
  totalPoints,
  bestScore,
});

const finalized = (score: number): TalliedAttempt => ({
  themeId: THEME,
  status: "finalized",
  score,
  issuedAt: ISSUED_YESTERDAY,
});

const active = (issuedAt: Date): TalliedAttempt => ({
  themeId: THEME,
  status: "active",
  score: null,
  issuedAt,
});

const noPractice = { sessionCount: 0, totalPoints: 0, bestScore: null };
const noCompetition = { attemptCount: 0, judgedCount: 0, totalPoints: 0, bestScore: null };

describe("themeTallies", () => {
  it("adds a Theme's sessions to its baselines, keeping the highest best", () => {
    expect(themeTallies([sum(2, 70, 40), sum(3, 90, 45)], [], TODAY)).toEqual([
      {
        themeId: THEME,
        practice: { sessionCount: 5, totalPoints: 160, bestScore: 45 },
        competition: noCompetition,
      },
    ]);
  });

  it("knows no practice best until a session or a baseline holds one", () => {
    expect(themeTallies([sum(3, 90, null)], [], TODAY)[0]?.practice.bestScore).toBeNull();
    expect(themeTallies([sum(3, 90, null), sum(1, 20, 20)], [], TODAY)[0]?.practice.bestScore).toBe(
      20,
    );
  });

  it("judges completed, quit and expired Attempts on their stored score", () => {
    expect(themeTallies([], [finalized(35), finalized(10), finalized(0)], TODAY)).toEqual([
      {
        themeId: THEME,
        practice: noPractice,
        competition: { attemptCount: 3, judgedCount: 3, totalPoints: 45, bestScore: 35 },
      },
    ]);
  });

  it("judges an Attempt left active since an earlier Paris day at 0", () => {
    expect(themeTallies([], [finalized(30), active(ISSUED_YESTERDAY)], TODAY)[0]).toEqual({
      themeId: THEME,
      practice: noPractice,
      competition: { attemptCount: 2, judgedCount: 2, totalPoints: 30, bestScore: 30 },
    });
  });

  it("counts an Attempt issued today as a game and judges it not yet", () => {
    expect(themeTallies([], [finalized(30), active(ISSUED_TODAY)], TODAY)[0]).toEqual({
      themeId: THEME,
      practice: noPractice,
      competition: { attemptCount: 2, judgedCount: 1, totalPoints: 30, bestScore: 30 },
    });
  });

  it("gives a Theme whose only game is unjudged no score and no best", () => {
    expect(themeTallies([], [active(ISSUED_TODAY)], TODAY)).toEqual([
      {
        themeId: THEME,
        practice: noPractice,
        competition: { attemptCount: 1, judgedCount: 0, totalPoints: 0, bestScore: null },
      },
    ]);
  });

  it("reads the issuance day in Paris, where the evening turns over before UTC", () => {
    const issuedLateParisYesterday = new Date("2026-08-19T21:59:59.000Z");
    const issuedEarlyParisToday = new Date("2026-08-19T22:00:00.000Z");
    expect(themeTallies([], [active(issuedLateParisYesterday)], TODAY)[0]?.competition).toEqual({
      attemptCount: 1,
      judgedCount: 1,
      totalPoints: 0,
      bestScore: 0,
    });
    expect(themeTallies([], [active(issuedEarlyParisToday)], TODAY)[0]?.competition).toEqual({
      attemptCount: 1,
      judgedCount: 0,
      totalPoints: 0,
      bestScore: null,
    });
  });

  it("keeps each Theme's games on its own tally", () => {
    const tallies = themeTallies(
      [sum(1, 30, 30)],
      [{ ...finalized(40), themeId: "theme-b" }],
      TODAY,
    );
    expect(tallies.map((tally) => tally.themeId)).toEqual([THEME, "theme-b"]);
    expect(tallies[0]?.competition).toEqual(noCompetition);
    expect(tallies[1]?.practice).toEqual(noPractice);
  });

  it("gives no tally to a Theme holding no game", () => {
    expect(themeTallies([], [], TODAY)).toEqual([]);
    expect(themeTallies([sum(0, 0, null)], [], TODAY)).toEqual([]);
  });
});
