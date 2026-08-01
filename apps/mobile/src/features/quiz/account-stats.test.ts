import { describe, expect, it } from "vitest";
import { type AccountSession, foldAccountStats, type StatBaseline } from "./account-stats";
import { homeCards } from "./stats";

describe("foldAccountStats", () => {
  it("is an empty world with no baselines, sessions or pending rows", () => {
    expect(foldAccountStats([], [], [])).toStrictEqual({});
  });

  it("sums baselines carried by several devices into one per-Theme total", () => {
    const baselines: StatBaseline[] = [
      { themeId: "geo", themeName: "Géographie", totalPoints: 30, sessionCount: 2 }, // phone
      { themeId: "geo", themeName: "Géographie", totalPoints: 20, sessionCount: 1 }, // tablet
    ];
    expect(foldAccountStats(baselines, [], [])).toStrictEqual({
      geo: { name: "Géographie", totalPoints: 50, sessionCount: 3 },
    });
  });

  it("accumulates synced sessions of the same Theme (points sum, one count per session)", () => {
    const synced: AccountSession[] = [
      { themeId: "simpson", themeName: "Les Simpson", points: 35 },
      { themeId: "simpson", themeName: "Les Simpson", points: 15 },
    ];
    expect(foldAccountStats([], synced, [])).toStrictEqual({
      simpson: { name: "Les Simpson", totalPoints: 50, sessionCount: 2 },
    });
  });

  it("overlays still-pending local sessions on top of baselines and synced sessions", () => {
    const baselines: StatBaseline[] = [
      { themeId: "geo", themeName: "Géographie", totalPoints: 40, sessionCount: 2 },
    ];
    const synced: AccountSession[] = [{ themeId: "geo", themeName: "Géographie", points: 10 }];
    const pending: AccountSession[] = [{ themeId: "geo", themeName: "Géographie", points: 25 }];
    // 40 + 10 + 25 points across 2 + 1 + 1 sessions.
    expect(foldAccountStats(baselines, synced, pending)).toStrictEqual({
      geo: { name: "Géographie", totalPoints: 75, sessionCount: 4 },
    });
  });

  it("keeps Themes independent across all three inputs", () => {
    const baselines: StatBaseline[] = [
      { themeId: "geo", themeName: "Géographie", totalPoints: 20, sessionCount: 1 },
    ];
    const synced: AccountSession[] = [{ themeId: "simpson", themeName: "Les Simpson", points: 35 }];
    const pending: AccountSession[] = [
      { themeId: "marie", themeName: "Marie Antoinette", points: 40 },
    ];
    expect(foldAccountStats(baselines, synced, pending)).toStrictEqual({
      geo: { name: "Géographie", totalPoints: 20, sessionCount: 1 },
      simpson: { name: "Les Simpson", totalPoints: 35, sessionCount: 1 },
      marie: { name: "Marie Antoinette", totalPoints: 40, sessionCount: 1 },
    });
  });

  describe("Theme-name capture precedence (most recent capture wins)", () => {
    it("lets a session name override an older baseline name for the same Theme id", () => {
      const baselines: StatBaseline[] = [
        { themeId: "geo", themeName: "Ancien nom", totalPoints: 10, sessionCount: 1 },
      ];
      const synced: AccountSession[] = [{ themeId: "geo", themeName: "Nouveau nom", points: 20 }];
      expect(foldAccountStats(baselines, synced, [])).toStrictEqual({
        geo: { name: "Nouveau nom", totalPoints: 30, sessionCount: 2 },
      });
    });

    it("lets the last (most recent) session name win, pending over synced", () => {
      const synced: AccountSession[] = [
        { themeId: "geo", themeName: "Nom 1", points: 10 },
        { themeId: "geo", themeName: "Nom 2", points: 10 },
      ];
      const pending: AccountSession[] = [{ themeId: "geo", themeName: "Nom 3", points: 10 }];
      expect(foldAccountStats([], synced, pending)).toStrictEqual({
        geo: { name: "Nom 3", totalPoints: 30, sessionCount: 3 },
      });
    });

    it("keeps a baseline name when no session recaptures it", () => {
      const baselines: StatBaseline[] = [
        { themeId: "geo", themeName: "Géographie", totalPoints: 10, sessionCount: 1 },
      ];
      expect(foldAccountStats(baselines, [], [])).toStrictEqual({
        geo: { name: "Géographie", totalPoints: 10, sessionCount: 1 },
      });
    });
  });

  it("mutates none of its inputs", () => {
    const baselines: StatBaseline[] = [
      { themeId: "geo", themeName: "Géographie", totalPoints: 20, sessionCount: 1 },
    ];
    const synced: AccountSession[] = [{ themeId: "geo", themeName: "Géographie", points: 10 }];
    const pending: AccountSession[] = [{ themeId: "geo", themeName: "Géographie", points: 5 }];
    const snapshot = structuredClone({ baselines, synced, pending });
    foldAccountStats(baselines, synced, pending);
    expect({ baselines, synced, pending }).toStrictEqual(snapshot);
  });

  it("feeds the existing home shelf, keeping a Theme absent from any catalog by its captured name", () => {
    // A Theme id no catalog knows still renders: its name was captured when the session recorded.
    const synced: AccountSession[] = [
      { themeId: "retired-2024", themeName: "Thème disparu", points: 40 },
      { themeId: "retired-2024", themeName: "Thème disparu", points: 30 },
    ];
    expect(homeCards(foldAccountStats([], synced, []))).toStrictEqual([
      { id: "retired-2024", name: "Thème disparu", average: 35 },
    ]);
  });
});
