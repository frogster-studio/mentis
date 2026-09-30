import type { AppHistorySession } from "@mentis/contracts/app";
import { SessionTypeEnum } from "@mentis/contracts/enums";
import { describe, expect, it } from "vitest";
import { historyPage } from "../utils/history-page";

const SIZE = 20;
const NEWEST_MS = Date.parse("2026-09-30T12:00:00.000Z");
const MINUTE_MS = 60_000;

const line = (type: SessionTypeEnum, minutesAgo: number): AppHistorySession => ({
  id: `${type}-${minutesAgo}`,
  type,
  themeId: "theme-a",
  themeName: "Cinéma",
  category: null,
  score: 30,
  questionCount: 10,
  durationMs: null,
  playedAt: new Date(NEWEST_MS - minutesAgo * MINUTE_MS).toISOString(),
});

const lines = (type: SessionTypeEnum, minutesAgo: number[]): AppHistorySession[] =>
  minutesAgo.map((minutes) => line(type, minutes));

const everyMinute = (count: number, offset = 0, step = 1): number[] =>
  Array.from({ length: count }, (_, index) => offset + index * step);

const playedMs = (sessions: AppHistorySession[]): number[] =>
  sessions.map((session) => Date.parse(session.playedAt));

describe("historyPage", () => {
  it("merges both kinds newest first and ends the History when both reads fall short", () => {
    const practice = lines(SessionTypeEnum.PRACTICE, everyMinute(12, 0, 2));
    const competition = lines(SessionTypeEnum.COMPETITION, everyMinute(8, 1, 2));

    const page = historyPage(practice, competition, SIZE);

    expect(page.sessions).toHaveLength(20);
    expect(playedMs(page.sessions)).toEqual(playedMs(page.sessions).toSorted((a, b) => b - a));
    expect(page.sessions.slice(0, 2).map((session) => session.type)).toEqual([
      SessionTypeEnum.PRACTICE,
      SessionTypeEnum.COMPETITION,
    ]);
    expect(page.nextBefore).toBeNull();
  });

  it("cuts at the page size and names the last line's playedAt, every cut line no newer", () => {
    const practice = lines(SessionTypeEnum.PRACTICE, everyMinute(20, 0, 2));
    const competition = lines(SessionTypeEnum.COMPETITION, [5, 25, 60]);

    const page = historyPage(practice, competition, SIZE);

    expect(page.sessions).toHaveLength(20);
    expect(page.nextBefore).toBe(page.sessions[19]?.playedAt);
    const kept = new Set(page.sessions);
    const cutMs = playedMs([...practice, ...competition].filter((session) => !kept.has(session)));
    expect(cutMs).toHaveLength(3);
    for (const ms of cutMs) {
      expect(ms).toBeLessThanOrEqual(Date.parse(page.nextBefore ?? ""));
    }
  });

  it("names a next page when both reads fall short but together overflow the page", () => {
    const practice = lines(SessionTypeEnum.PRACTICE, everyMinute(11, 0, 2));
    const competition = lines(SessionTypeEnum.COMPETITION, everyMinute(10, 1, 2));

    const page = historyPage(practice, competition, SIZE);

    expect(page.sessions).toHaveLength(20);
    expect(page.nextBefore).toBe(page.sessions[19]?.playedAt);
  });

  it("gives an empty History no line and no next page", () => {
    expect(historyPage([], [], SIZE)).toEqual({ sessions: [], nextBefore: null });
  });

  it("names a next page when one kind alone fills the page", () => {
    const competition = lines(SessionTypeEnum.COMPETITION, everyMinute(20));

    const page = historyPage([], competition, SIZE);

    expect(page.sessions).toEqual(competition);
    expect(page.nextBefore).toBe(competition[19]?.playedAt);
  });
});
