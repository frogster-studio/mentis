import type { AppCompetitionDayResponse } from "@mentis/contracts/app";
import type { QueryKey, QueryStatus } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { competitionKeys } from "@/features/competition/keys";
import { worldKeys } from "@/features/world/keys";
import { ACCOUNT_QUERY_ROOT, shouldPersistQuery } from "./query-persistence";

const NOW = new Date("2026-10-15T10:00:00Z");
const PLAYER = "player-1";
const PLAYED = "0b6f3c1e-4a8d-4f5b-9c2e-7d1a3b5c9e01";
const OTHER = "5e2d8a7c-1b3f-4c6d-8e9a-0f1b2c3d4e5f";

const cachedDay: AppCompetitionDayResponse = {
  day: "2026-10-15",
  replay: true,
  catchup: false,
  attempts: [{ id: PLAYED, kind: "initial", score: 32 }],
};

const query = (queryKey: QueryKey, data: unknown, status: QueryStatus = "success") => ({
  queryKey,
  state: { status, data },
});

const persists = (candidate: ReturnType<typeof query>, days = [cachedDay]) =>
  shouldPersistQuery(candidate, () => days, NOW);

describe("shouldPersistQuery", () => {
  it("keeps every successful account read", () => {
    expect(persists(query([ACCOUNT_QUERY_ROOT, "stats", PLAYER], {}))).toBe(true);
    expect(persists(query([ACCOUNT_QUERY_ROOT, "history", PLAYER], {}))).toBe(true);
  });

  it("keeps the Day and the Standing", () => {
    expect(persists(query(competitionKeys.day(PLAYER), cachedDay))).toBe(true);
    expect(persists(query(competitionKeys.standing(PLAYER), { season: "2026-10" }))).toBe(true);
  });

  it("keeps a Leaderboard page of the current Season only", () => {
    expect(persists(query(worldKeys.leaderboardPage(2), { season: "2026-10" }))).toBe(true);
    expect(persists(query(worldKeys.leaderboardPage(2), { season: "2026-09" }))).toBe(false);
  });

  it("keeps the transcript of an Attempt in the cached Day only", () => {
    expect(persists(query(competitionKeys.transcript(PLAYED), { id: PLAYED }))).toBe(true);
    expect(persists(query(competitionKeys.transcript(OTHER), { id: OTHER }))).toBe(false);
    expect(persists(query(competitionKeys.transcript(PLAYED), { id: PLAYED }), [])).toBe(false);
  });

  it("drops Attempt issuance", () => {
    expect(persists(query(competitionKeys.attempt(PLAYER, "initial"), { id: PLAYED }))).toBe(false);
  });

  it("drops a read that has not succeeded", () => {
    expect(persists(query([ACCOUNT_QUERY_ROOT, "stats", PLAYER], undefined, "pending"))).toBe(
      false,
    );
    expect(persists(query(competitionKeys.day(PLAYER), undefined, "error"))).toBe(false);
  });

  it("drops every other read", () => {
    expect(persists(query(["quiz", "themes"], []))).toBe(false);
  });
});
