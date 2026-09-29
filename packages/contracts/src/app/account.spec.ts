import { describe, expect, it } from "vitest";
import {
  appAccountStatsResponseSchema,
  appPracticeDayPushInputSchema,
  appQuizSessionPushInputSchema,
  appStatBaselinePushInputSchema,
  MAX_PUSH_BATCH,
} from "./account";

const session = (overrides: Record<string, unknown> = {}) => ({
  id: "3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  themeId: "geo",
  themeName: "Géographie",
  points: 35,
  finishedAt: "2026-08-11T10:00:00.000Z",
  ...overrides,
});

const baseline = (overrides: Record<string, unknown> = {}) => ({
  device: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  themeId: "geo",
  themeName: "Géographie",
  totalPoints: 120,
  sessionCount: 4,
  bestScore: 45,
  ...overrides,
});

const streak = (overrides: Record<string, unknown> = {}) => ({
  lastDay: "2026-08-11",
  length: 3,
  longest: 5,
  ...overrides,
});

const category = {
  id: "c1",
  name: "Culture",
  color: "#aabbcc",
  secondaryColor: "#112233",
  icon: "book",
};

const tally = (overrides: Record<string, unknown> = {}) => ({
  themeId: "geo",
  themeName: "Géographie",
  category,
  practice: { sessionCount: 5, totalPoints: 160, bestScore: 45 },
  competition: { attemptCount: 3, judgedCount: 2, totalPoints: 45, bestScore: 35 },
  ...overrides,
});

const practiceDay = (overrides: Record<string, unknown> = {}) => ({
  device: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  day: "2026-08-11",
  ...overrides,
});

describe.each([
  ["appQuizSessionPushInputSchema", appQuizSessionPushInputSchema, session],
  ["appStatBaselinePushInputSchema", appStatBaselinePushInputSchema, baseline],
])("%s", (_name, schema, row) => {
  it("strips owner — the wire shape never carries it", () => {
    const [parsed] = schema.parse([row({ owner: "someone-else" })]);
    expect(parsed).not.toHaveProperty("owner");
  });
});

describe("appQuizSessionPushInputSchema", () => {
  it("accepts a full batch and rejects one row more", () => {
    const full = Array.from({ length: MAX_PUSH_BATCH }, () => session());
    expect(appQuizSessionPushInputSchema.safeParse(full).success).toBe(true);
    expect(appQuizSessionPushInputSchema.safeParse([...full, session()]).success).toBe(false);
  });

  it("requires a client uuid and an ISO finish time", () => {
    expect(appQuizSessionPushInputSchema.safeParse([session({ id: "s1" })]).success).toBe(false);
    expect(
      appQuizSessionPushInputSchema.safeParse([session({ finishedAt: "yesterday" })]).success,
    ).toBe(false);
    expect(
      appQuizSessionPushInputSchema.safeParse([
        session({ finishedAt: "2026-08-11T12:00:00+02:00" }),
      ]).success,
    ).toBe(true);
  });
});

describe("appStatBaselinePushInputSchema", () => {
  it("accepts a full batch and rejects one row more", () => {
    const full = Array.from({ length: MAX_PUSH_BATCH }, () => baseline());
    expect(appStatBaselinePushInputSchema.safeParse(full).success).toBe(true);
    expect(appStatBaselinePushInputSchema.safeParse([...full, baseline()]).success).toBe(false);
  });

  it("requires a device uuid and non-negative totals", () => {
    expect(appStatBaselinePushInputSchema.safeParse([baseline({ device: "d1" })]).success).toBe(
      false,
    );
    expect(appStatBaselinePushInputSchema.safeParse([baseline({ totalPoints: -1 })]).success).toBe(
      false,
    );
  });

  it("carries a best score out of 50, or null when unknown", () => {
    expect(appStatBaselinePushInputSchema.parse([baseline()])[0]?.bestScore).toBe(45);
    expect(
      appStatBaselinePushInputSchema.parse([baseline({ bestScore: null })])[0]?.bestScore,
    ).toBe(null);
    for (const bestScore of [51, -1, 12.5, undefined]) {
      expect(appStatBaselinePushInputSchema.safeParse([baseline({ bestScore })]).success).toBe(
        false,
      );
    }
  });
});

describe("appAccountStatsResponseSchema", () => {
  const stats = (practiceStreak: unknown, themes: unknown[] = []) => ({
    themes,
    baselines: [],
    sessions: [],
    practiceStreak,
    competitionStreak: { lastDay: null, length: 0, longest: 0 },
  });

  it("parses both Streaks, a dayless one included", () => {
    expect(appAccountStatsResponseSchema.parse(stats(streak()))).toEqual(stats(streak()));
  });

  it("rejects a longest below length", () => {
    expect(
      appAccountStatsResponseSchema.safeParse(stats(streak({ length: 6, longest: 5 }))).success,
    ).toBe(false);
  });

  it("rejects a lastDay that is not an ISO date", () => {
    expect(
      appAccountStatsResponseSchema.safeParse(stats(streak({ lastDay: "2026-08-11T10:00:00Z" })))
        .success,
    ).toBe(false);
  });
});

describe("appAccountStatsResponseSchema — themes", () => {
  const parse = (row: unknown) =>
    appAccountStatsResponseSchema.safeParse({
      themes: [row],
      baselines: [],
      sessions: [],
      practiceStreak: streak(),
      competitionStreak: streak(),
    });

  it("parses a tally, and one without a Category or a known best", () => {
    expect(parse(tally()).success).toBe(true);
    expect(
      parse(
        tally({
          category: null,
          practice: { sessionCount: 1, totalPoints: 20, bestScore: null },
          competition: { attemptCount: 0, judgedCount: 0, totalPoints: 0, bestScore: null },
        }),
      ).success,
    ).toBe(true);
  });

  it("parses a Theme whose only game is an unjudged Attempt", () => {
    expect(
      parse(
        tally({
          practice: { sessionCount: 0, totalPoints: 0, bestScore: null },
          competition: { attemptCount: 1, judgedCount: 0, totalPoints: 0, bestScore: null },
        }),
      ).success,
    ).toBe(true);
  });

  it("rejects more judged Attempts than Attempts issued", () => {
    expect(
      parse(
        tally({
          competition: { attemptCount: 1, judgedCount: 2, totalPoints: 20, bestScore: 10 },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects a tally holding no game", () => {
    expect(
      parse(
        tally({
          practice: { sessionCount: 0, totalPoints: 0, bestScore: null },
          competition: { attemptCount: 0, judgedCount: 0, totalPoints: 0, bestScore: null },
        }),
      ).success,
    ).toBe(false);
  });

  it.each([
    ["a negative count", { practice: { sessionCount: -1, totalPoints: 0, bestScore: null } }],
    ["negative points", { practice: { sessionCount: 1, totalPoints: -5, bestScore: null } }],
    ["a best of 51", { practice: { sessionCount: 1, totalPoints: 51, bestScore: 51 } }],
    [
      "a fractional best",
      { competition: { attemptCount: 1, judgedCount: 1, totalPoints: 10, bestScore: 10.5 } },
    ],
    ["a malformed category", { category: { ...category, color: "red" } }],
  ])("rejects %s", (_case, overrides) => {
    expect(parse(tally(overrides)).success).toBe(false);
  });
});

describe("appPracticeDayPushInputSchema", () => {
  it("accepts a full batch and rejects one row more", () => {
    const full = Array.from({ length: MAX_PUSH_BATCH }, () => practiceDay());
    expect(appPracticeDayPushInputSchema.safeParse(full).success).toBe(true);
    expect(appPracticeDayPushInputSchema.safeParse([...full, practiceDay()]).success).toBe(false);
  });

  it("requires a device uuid and an ISO date", () => {
    expect(appPracticeDayPushInputSchema.safeParse([practiceDay({ device: "d1" })]).success).toBe(
      false,
    );
    expect(
      appPracticeDayPushInputSchema.safeParse([practiceDay({ day: "2026-02-30" })]).success,
    ).toBe(false);
  });
});
