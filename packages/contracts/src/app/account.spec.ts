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
  ...overrides,
});

const streak = (overrides: Record<string, unknown> = {}) => ({
  lastDay: "2026-08-11",
  length: 3,
  longest: 5,
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
});

describe("appAccountStatsResponseSchema", () => {
  const stats = (practiceStreak: unknown) => ({
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
