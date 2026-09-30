import type { AppHistorySession } from "@mentis/contracts/app";
import { SessionTypeEnum } from "@mentis/contracts/enums";
import { describe, expect, it } from "vitest";
import { historySections } from "./history-sections";

const TODAY = new Date(2026, 8, 30, 15, 0);

function line(id: string, playedAt: Date): AppHistorySession {
  return {
    id,
    type: SessionTypeEnum.PRACTICE,
    themeId: "histoire",
    themeName: "Histoire de France",
    category: null,
    score: 35,
    questionCount: 10,
    durationMs: null,
    playedAt: playedAt.toISOString(),
  };
}

const titles = (sessions: AppHistorySession[]) =>
  historySections(sessions, TODAY).map((section) => section.title);

describe("historySections", () => {
  it("gives no section to an empty History", () => {
    expect(historySections([], TODAY)).toEqual([]);
  });

  it("titles today and yesterday", () => {
    expect(
      titles([line("a", new Date(2026, 8, 30, 0, 5)), line("b", new Date(2026, 8, 29, 23, 55))]),
    ).toEqual(["Aujourd'hui", "Hier"]);
  });

  it("titles an older day of this year by its weekday and date", () => {
    expect(titles([line("a", new Date(2026, 8, 28, 18, 4))])).toEqual(["lundi 28 septembre"]);
  });

  it("appends the year to a day of a previous year", () => {
    expect(titles([line("a", new Date(2025, 11, 31, 20, 0))])).toEqual([
      "mercredi 31 décembre 2025",
    ]);
  });

  it("gathers the lines of one day in one section, in the pages' order", () => {
    const sessions = [
      line("a", new Date(2026, 8, 28, 21, 0)),
      line("b", new Date(2026, 8, 28, 8, 0)),
      line("c", new Date(2026, 8, 27, 12, 0)),
    ];

    expect(
      historySections(sessions, TODAY).map(({ title, data }) => ({
        title,
        ids: data.map((session) => session.id),
      })),
    ).toEqual([
      { title: "lundi 28 septembre", ids: ["a", "b"] },
      { title: "dimanche 27 septembre", ids: ["c"] },
    ]);
  });
});
