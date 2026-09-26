import { describe, expect, it } from "vitest";
import { streakFromDays } from "../utils/streak";

describe("streakFromDays", () => {
  it("gives an empty Streak for no day", () => {
    expect(streakFromDays([])).toEqual({ lastDay: null, length: 0, longest: 0 });
  });

  it("counts the run ending at the last day and keeps the longest run", () => {
    expect(streakFromDays(["2026-04-01", "2026-04-02", "2026-04-03", "2026-04-05"])).toEqual({
      lastDay: "2026-04-05",
      length: 1,
      longest: 3,
    });
  });

  it("counts a run crossing a month and a year boundary as one run", () => {
    expect(streakFromDays(["2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"])).toEqual({
      lastDay: "2026-01-02",
      length: 4,
      longest: 4,
    });
    expect(streakFromDays(["2026-02-27", "2026-02-28", "2026-03-01"])).toEqual({
      lastDay: "2026-03-01",
      length: 3,
      longest: 3,
    });
  });

  it("counts a run across the Paris daylight-saving switch as one run", () => {
    expect(streakFromDays(["2026-03-28", "2026-03-29", "2026-03-30"])).toEqual({
      lastDay: "2026-03-30",
      length: 3,
      longest: 3,
    });
  });

  it("reads unsorted and duplicated days as their sorted distinct set", () => {
    const sorted = ["2026-04-01", "2026-04-02", "2026-04-03", "2026-04-05"];
    expect(
      streakFromDays(["2026-04-05", "2026-04-02", "2026-04-01", "2026-04-02", "2026-04-03"]),
    ).toEqual(streakFromDays(sorted));
  });
});
