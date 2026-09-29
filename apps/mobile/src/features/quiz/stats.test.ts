import { describe, expect, it } from "vitest";
import type { Category, ThemeWithCount } from "@/types/quiz";
import { type DeviceStats, deviceTallies, recordPracticeDay, recordSession } from "./stats";

const HISTORY = {
  id: "history",
  name: "Histoire",
  color: "#8d6e63",
  secondaryColor: "#efebe9",
  icon: "castle",
};

const NATURE = {
  id: "nature",
  name: "Nature",
  color: "#2e7d32",
  secondaryColor: "#e8f5e9",
  icon: "park",
};

describe("recordSession", () => {
  it("creates a theme entry capturing the name, the Category and the best on the first finished session", () => {
    expect(recordSession({}, "marie-antoinette", "Marie Antoinette", HISTORY, 35)).toStrictEqual({
      "marie-antoinette": {
        name: "Marie Antoinette",
        totalPoints: 35,
        sessionCount: 1,
        bestScore: 35,
        category: HISTORY,
      },
    });
  });

  it("accumulates points and count across sessions of the same theme, raising the best", () => {
    const after = recordSession(
      recordSession({}, "marie-antoinette", "Marie Antoinette", HISTORY, 20),
      "marie-antoinette",
      "Marie Antoinette",
      HISTORY,
      35,
    );
    expect(after).toStrictEqual({
      "marie-antoinette": {
        name: "Marie Antoinette",
        totalPoints: 55,
        sessionCount: 2,
        bestScore: 35,
        category: HISTORY,
      },
    });
  });

  it("keeps the best when a later session scores lower", () => {
    const after = recordSession(
      recordSession({}, "marie-antoinette", "Marie Antoinette", HISTORY, 35),
      "marie-antoinette",
      "Marie Antoinette",
      HISTORY,
      20,
    );
    expect(after["marie-antoinette"]?.bestScore).toBe(35);
  });

  it("keeps themes independent", () => {
    const after = recordSession(
      recordSession({}, "marie-antoinette", "Marie Antoinette", HISTORY, 35),
      "les-simpson",
      "Les Simpson",
      NATURE,
      10,
    );
    expect(after).toStrictEqual({
      "marie-antoinette": {
        name: "Marie Antoinette",
        totalPoints: 35,
        sessionCount: 1,
        bestScore: 35,
        category: HISTORY,
      },
      "les-simpson": {
        name: "Les Simpson",
        totalPoints: 10,
        sessionCount: 1,
        bestScore: 10,
        category: NATURE,
      },
    });
  });

  it("records a zero-point session as a real session (count still advances)", () => {
    expect(recordSession({}, "les-simpson", "Les Simpson", NATURE, 0)).toStrictEqual({
      "les-simpson": {
        name: "Les Simpson",
        totalPoints: 0,
        sessionCount: 1,
        bestScore: 0,
        category: NATURE,
      },
    });
  });

  it("gives an entry recorded before bests were captured the new session's points as its best", () => {
    const legacy: DeviceStats = { geo: { name: "Géographie", totalPoints: 90, sessionCount: 3 } };
    expect(recordSession(legacy, "geo", "Géographie", NATURE, 20)).toStrictEqual({
      geo: {
        name: "Géographie",
        totalPoints: 110,
        sessionCount: 4,
        bestScore: 20,
        category: NATURE,
      },
    });
  });

  it("does not mutate the input stats", () => {
    const stats: DeviceStats = {
      "marie-antoinette": { name: "Marie Antoinette", totalPoints: 35, sessionCount: 1 },
    };
    const snapshot = structuredClone(stats);
    recordSession(stats, "marie-antoinette", "Marie Antoinette", HISTORY, 20);
    expect(stats).toStrictEqual(snapshot);
  });
});

describe("deviceTallies", () => {
  const catalogTheme = (id: string, category: Category): ThemeWithCount => ({
    id,
    name: id,
    imageUrl: `https://cdn.example.com/${id}.webp`,
    questionCount: 20,
    category,
  });
  const capturedGeo: DeviceStats = {
    geo: { name: "Géographie", totalPoints: 90, sessionCount: 3, bestScore: 45, category: NATURE },
  };

  it("folds each Device Stats entry into its practice, with an empty competition", () => {
    expect(deviceTallies(capturedGeo, [])).toStrictEqual([
      {
        themeId: "geo",
        themeName: "Géographie",
        category: NATURE,
        practice: { sessionCount: 3, totalPoints: 90, bestScore: 45 },
        competition: { attemptCount: 0, judgedCount: 0, totalPoints: 0, bestScore: null },
      },
    ]);
  });

  it("lets the catalog's Category win over the captured one", () => {
    const [tally] = deviceTallies(capturedGeo, [catalogTheme("geo", HISTORY)]);
    expect(tally?.category).toStrictEqual(HISTORY);
  });

  it("falls back on the captured Category for a Theme the catalog no longer holds", () => {
    const [tally] = deviceTallies(capturedGeo, [catalogTheme("simpson", HISTORY)]);
    expect(tally?.category).toStrictEqual(NATURE);
  });

  it("reads an entry recorded before this work with an unknown best and the catalog's Category", () => {
    const legacy: DeviceStats = { geo: { name: "Géographie", totalPoints: 90, sessionCount: 3 } };
    const [tally] = deviceTallies(legacy, [catalogTheme("geo", HISTORY)]);
    expect(tally?.category).toStrictEqual(HISTORY);
    expect(tally?.practice.bestScore).toBeNull();
  });

  it("leaves a Theme without a Category when neither the catalog nor the entry knows it", () => {
    const legacy: DeviceStats = { geo: { name: "Géographie", totalPoints: 90, sessionCount: 3 } };
    const [tally] = deviceTallies(legacy, []);
    expect(tally?.category).toBeNull();
  });

  it("is empty on a fresh install", () => {
    expect(deviceTallies({}, [])).toStrictEqual([]);
  });
});

describe("recordPracticeDay", () => {
  it("records the Paris day of a first finished session", () => {
    expect(recordPracticeDay([], "2026-04-01")).toStrictEqual(["2026-04-01"]);
  });

  it("holds a day once however many sessions finished on it", () => {
    const days = recordPracticeDay(["2026-04-01"], "2026-04-01");
    expect(days).toStrictEqual(["2026-04-01"]);
  });

  it("keeps every distinct day", () => {
    expect(recordPracticeDay(["2026-04-01"], "2026-04-02")).toStrictEqual([
      "2026-04-01",
      "2026-04-02",
    ]);
  });

  it("does not mutate the input days", () => {
    const days = ["2026-04-01"];
    recordPracticeDay(days, "2026-04-02");
    expect(days).toStrictEqual(["2026-04-01"]);
  });
});
