import { describe, expect, it } from "vitest";
import type { Category, ThemeWithCount } from "@/types/quiz";
import {
  attachCategories,
  type DeviceStats,
  deviceTallies,
  formatAverage,
  formatSessionCount,
  type HomeCard,
  homeCards,
  recordPracticeDay,
  recordSession,
  themeAverage,
} from "./stats";

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

describe("themeAverage", () => {
  it("divides total points by session count", () => {
    expect(themeAverage({ name: "Les Simpson", totalPoints: 35, sessionCount: 2 })).toBe(17.5);
  });

  it("returns the single score for a lone session", () => {
    expect(themeAverage({ name: "Les Simpson", totalPoints: 35, sessionCount: 1 })).toBe(35);
  });
});

describe("formatAverage", () => {
  it("drops the decimal for a whole number (no trailing « ,0 »)", () => {
    expect(formatAverage(35)).toBe("35");
    expect(formatAverage(0)).toBe("0");
  });

  it("uses a comma for a half point", () => {
    expect(formatAverage(17.5)).toBe("17,5");
  });

  it("rounds to a single decimal place", () => {
    expect(formatAverage(50 / 3)).toBe("16,7"); // 16.666… → 16,7
    expect(formatAverage(35 / 3)).toBe("11,7"); // 11.666… → 11,7
    expect(formatAverage(10 / 3)).toBe("3,3"); // 3.333… → 3,3
  });

  it("rounds up a value that lands back on a whole number", () => {
    expect(formatAverage(34.98)).toBe("35"); // 34.98 → 35,0 → « 35 »
  });

  it("rounds half up at the first decimal", () => {
    expect(formatAverage(12.25)).toBe("12,3");
  });
});

describe("formatSessionCount", () => {
  it("keeps « partie » singular at one session", () => {
    expect(formatSessionCount(1)).toBe("1 partie");
  });

  it("pluralises beyond one, uncapped", () => {
    expect(formatSessionCount(2)).toBe("2 parties");
    expect(formatSessionCount(137)).toBe("137 parties");
  });
});

describe("homeCards", () => {
  it("is empty on a fresh install (nothing played)", () => {
    expect(homeCards({})).toStrictEqual([]);
  });

  it("shows one card per played theme, sorted by average descending", () => {
    const stats: DeviceStats = {
      geo: { name: "Géographie", totalPoints: 20, sessionCount: 2 }, // avg 10
      simpson: { name: "Les Simpson", totalPoints: 35, sessionCount: 1 }, // avg 35
    };
    expect(homeCards(stats)).toStrictEqual([
      { id: "simpson", name: "Les Simpson", average: 35, sessionCount: 1 },
      { id: "geo", name: "Géographie", average: 10, sessionCount: 2 },
    ]);
  });

  it("carries the recorded name onto each card", () => {
    const stats: DeviceStats = {
      "marie-antoinette": { name: "Marie Antoinette", totalPoints: 40, sessionCount: 1 },
    };
    expect(homeCards(stats)).toStrictEqual([
      { id: "marie-antoinette", name: "Marie Antoinette", average: 40, sessionCount: 1 },
    ]);
  });

  it("keeps a played but zero-point theme on the shelf (average 0)", () => {
    const stats: DeviceStats = { geo: { name: "Géographie", totalPoints: 0, sessionCount: 1 } };
    expect(homeCards(stats)).toStrictEqual([
      { id: "geo", name: "Géographie", average: 0, sessionCount: 1 },
    ]);
  });

  it("omits an entry with zero sessions (never rendered as a shelf card)", () => {
    const stats: DeviceStats = { geo: { name: "Géographie", totalPoints: 0, sessionCount: 0 } };
    expect(homeCards(stats)).toStrictEqual([]);
  });
});

describe("attachCategories", () => {
  const card: HomeCard = { id: "geo", name: "Géographie", average: 10, sessionCount: 2 };
  const theme: ThemeWithCount = {
    id: "geo",
    name: "Géographie",
    imageUrl: "https://cdn.example.com/geo.webp",
    questionCount: 20,
    category: NATURE,
  };

  it("gives each card the category its theme carries in the catalog", () => {
    expect(attachCategories([card], [theme])).toStrictEqual([{ ...card, category: NATURE }]);
  });

  it("leaves a card whose theme left the catalog without a category", () => {
    expect(attachCategories([card], [])).toStrictEqual([{ ...card, category: undefined }]);
  });
});
