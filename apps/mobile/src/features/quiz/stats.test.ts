import { describe, expect, it } from "vitest";
import {
  type DeviceStats,
  formatAverage,
  formatSessionCount,
  homeCards,
  recordSession,
  themeAverage,
} from "./stats";

describe("recordSession", () => {
  it("creates a theme entry capturing the name on the first finished session", () => {
    expect(recordSession({}, "marie-antoinette", "Marie Antoinette", 35)).toStrictEqual({
      "marie-antoinette": { name: "Marie Antoinette", totalPoints: 35, sessionCount: 1 },
    });
  });

  it("accumulates points and count across sessions of the same theme", () => {
    const after = recordSession(
      recordSession({}, "marie-antoinette", "Marie Antoinette", 35),
      "marie-antoinette",
      "Marie Antoinette",
      20,
    );
    expect(after).toStrictEqual({
      "marie-antoinette": { name: "Marie Antoinette", totalPoints: 55, sessionCount: 2 },
    });
  });

  it("keeps themes independent", () => {
    const after = recordSession(
      recordSession({}, "marie-antoinette", "Marie Antoinette", 35),
      "les-simpson",
      "Les Simpson",
      10,
    );
    expect(after).toStrictEqual({
      "marie-antoinette": { name: "Marie Antoinette", totalPoints: 35, sessionCount: 1 },
      "les-simpson": { name: "Les Simpson", totalPoints: 10, sessionCount: 1 },
    });
  });

  it("records a zero-point session as a real session (count still advances)", () => {
    expect(recordSession({}, "les-simpson", "Les Simpson", 0)).toStrictEqual({
      "les-simpson": { name: "Les Simpson", totalPoints: 0, sessionCount: 1 },
    });
  });

  it("does not mutate the input stats", () => {
    const stats: DeviceStats = {
      "marie-antoinette": { name: "Marie Antoinette", totalPoints: 35, sessionCount: 1 },
    };
    const snapshot = structuredClone(stats);
    recordSession(stats, "marie-antoinette", "Marie Antoinette", 20);
    expect(stats).toStrictEqual(snapshot);
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
