import type { AppCompetitionStandingResponse } from "@mentis/contracts/app";
import { describe, expect, it } from "vitest";
import { formatRank, standingTitle } from "./standing-title";

const RANKED: AppCompetitionStandingResponse = {
  season: "2026-09",
  seasonTotal: 412,
  rank: 12,
  rankedCount: 340,
  page: 1,
};

describe("formatRank", () => {
  it("writes the first place « 1er » and every other place « Ne »", () => {
    expect(formatRank(1)).toBe("1er");
    expect(formatRank(2)).toBe("2e");
    expect(formatRank(3)).toBe("3e");
    expect(formatRank(21)).toBe("21e");
  });
});

describe("standingTitle", () => {
  it("reads the rank, the ranked Accounts and the Season Total", () => {
    expect(standingTitle(RANKED)).toBe("12e sur 340 · 412 pts");
  });

  it("says nothing while the read has not answered", () => {
    expect(standingTitle(undefined)).toBeNull();
  });

  it("says nothing for an Account the Season has not ranked", () => {
    expect(standingTitle({ ...RANKED, seasonTotal: 0, rank: null, page: null })).toBeNull();
  });
});
