import { describe, expect, it } from "vitest";
import { SessionTypeEnum } from "../enums";
import { appHistoryPageResponseSchema, appHistoryQuerySchema, HISTORY_PAGE_SIZE } from "./history";

const category = {
  id: "c1",
  name: "Culture",
  color: "#aabbcc",
  secondaryColor: "#112233",
  icon: "book",
};

const line = (overrides: Record<string, unknown> = {}) => ({
  id: "3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  type: SessionTypeEnum.COMPETITION,
  themeId: "geo",
  themeName: "Géographie",
  category,
  score: 35,
  questionCount: 10,
  durationMs: 133_000,
  playedAt: "2026-09-28T10:00:00.000Z",
  ...overrides,
});

const page = (overrides: Record<string, unknown> = {}) => ({
  sessions: [line()],
  nextBefore: "2026-09-28T10:00:00.000Z",
  ...overrides,
});

describe("appHistoryQuerySchema", () => {
  it("reads the newest page when no cursor is given", () => {
    expect(appHistoryQuerySchema.parse({})).toEqual({});
  });

  it("reads an ISO cursor with its offset", () => {
    const query = { before: "2026-09-28T12:00:00+02:00" };
    expect(appHistoryQuerySchema.parse(query)).toEqual(query);
  });

  it.each(["yesterday", "2026-09-28", "", "1759053600"])("rejects the cursor %p", (before) => {
    expect(appHistoryQuerySchema.safeParse({ before }).success).toBe(false);
  });
});

describe("appHistoryPageResponseSchema", () => {
  it("caps a page at the published size of 20", () => {
    expect(HISTORY_PAGE_SIZE).toBe(20);
    const sessions = Array.from({ length: HISTORY_PAGE_SIZE }, () => line());
    expect(appHistoryPageResponseSchema.safeParse(page({ sessions })).success).toBe(true);
    expect(
      appHistoryPageResponseSchema.safeParse(page({ sessions: [...sessions, line()] })).success,
    ).toBe(false);
  });

  it("accepts the last page and an empty History", () => {
    for (const last of [page({ nextBefore: null }), page({ sessions: [], nextBefore: null })]) {
      expect(appHistoryPageResponseSchema.parse(last)).toEqual(last);
    }
  });

  it("strips owner — the wire shape never carries it", () => {
    const parsed = appHistoryPageResponseSchema.parse(
      page({ sessions: [line({ owner: "someone-else" })] }),
    );
    expect(parsed).toEqual(page());
  });

  it.each([
    line({ durationMs: null }),
    line({ type: SessionTypeEnum.PRACTICE, durationMs: null }),
    line({ category: null }),
    line({ score: 0, durationMs: 0 }),
    line({ score: 75, questionCount: 15 }),
  ])("accepts the line %j", (accepted) => {
    expect(appHistoryPageResponseSchema.parse(page({ sessions: [accepted] }))).toEqual(
      page({ sessions: [accepted] }),
    );
  });

  it.each([
    { id: "s1" },
    { type: "initial" },
    { themeId: "" },
    { themeName: "" },
    { score: -1 },
    { score: 1.5 },
    { questionCount: 0 },
    { durationMs: -1 },
    { durationMs: 1.5 },
    { playedAt: "2026-09-28" },
  ])("rejects the line %j", (overrides) => {
    expect(
      appHistoryPageResponseSchema.safeParse(page({ sessions: [line(overrides)] })).success,
    ).toBe(false);
  });

  it("rejects a cursor that is not an ISO datetime", () => {
    expect(appHistoryPageResponseSchema.safeParse(page({ nextBefore: "yesterday" })).success).toBe(
      false,
    );
  });
});
