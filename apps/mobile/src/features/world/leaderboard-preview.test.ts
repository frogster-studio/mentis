import type { AppCompetitionLeaderboardPageResponse } from "@mentis/contracts/app";
import { describe, expect, it } from "vitest";
import { leaderboardPreview, previewNeighborPage, previewPage } from "./leaderboard-preview";

const entries = [1, 2, 3, 4, 5].map((rank) => ({
  rank,
  pseudo: `Player${rank}`,
  seasonTotal: 100 - rank,
}));
const page: AppCompetitionLeaderboardPageResponse = {
  season: "2026-09",
  page: 2,
  pageCount: 3,
  entries,
};

describe("leaderboardPreview", () => {
  it("centers the Player among nearby Accounts", () => {
    expect(leaderboardPreview(entries, "Player3")).toEqual(entries.slice(1, 4));
  });
  it("fills three rows at either end and for signed-out Players", () => {
    expect(leaderboardPreview(entries, "Player1")).toEqual(entries.slice(0, 3));
    expect(leaderboardPreview(entries, "Player5")).toEqual(entries.slice(2));
    expect(leaderboardPreview(entries, null)).toEqual(entries.slice(0, 3));
  });
  it("keeps ties and small or empty leaderboards intact", () => {
    const tied = entries.slice(0, 2).map((entry) => ({ ...entry, rank: 1 }));
    expect(leaderboardPreview(tied, "Player2")).toEqual(tied);
    expect(leaderboardPreview([], null)).toEqual([]);
  });
});

describe("previewPage", () => {
  const standing = { season: "2026-09", seasonTotal: 10, rank: 198, rankedCount: 230, page: 4 };
  it("opens a signed-out Player on the first page at once", () => {
    expect(previewPage(undefined, { data: undefined, isError: false })).toBe(1);
  });
  it("waits for the Standing, then opens on the Player's own page", () => {
    expect(previewPage("owner", { data: undefined, isError: false })).toBeNull();
    expect(previewPage("owner", { data: standing, isError: false })).toBe(4);
    expect(
      previewPage("owner", { data: { ...standing, rank: null, page: null }, isError: false }),
    ).toBe(1);
  });
  it("falls back to the first page when the Standing cannot be read", () => {
    expect(previewPage("owner", { data: undefined, isError: true })).toBe(1);
  });
});

describe("previewNeighborPage", () => {
  it("falls back when the Season shrinks below the Standing page", () => {
    expect(previewNeighborPage({ ...page, page: 4, pageCount: 1, entries: [] }, "Player1")).toBe(1);
    expect(previewNeighborPage({ ...page, page: 2, pageCount: 0, entries: [] }, null)).toBe(1);
  });
  it("loads neighbors across pagination boundaries", () => {
    expect(previewNeighborPage(page, "Player1")).toBe(1);
    expect(previewNeighborPage(page, "Player5")).toBe(3);
    expect(previewNeighborPage(page, "Player3")).toBeNull();
  });
  it("never requests a page outside the leaderboard", () => {
    expect(previewNeighborPage({ ...page, page: 1 }, "Player1")).toBeNull();
    expect(previewNeighborPage({ ...page, page: 3 }, "Player5")).toBeNull();
    expect(previewNeighborPage(page, null)).toBeNull();
  });
});
