import { describe, expect, it } from "vitest";
import { isCurrentDay, isCurrentSeason } from "./freshness";

describe("isCurrentDay", () => {
  it.each([
    ["2026-09-23T21:59:59Z", "2026-09-23", true],
    ["2026-09-23T22:00:00Z", "2026-09-23", false],
    ["2026-09-23T22:00:00Z", "2026-09-24", true],
    ["2026-01-15T22:59:59Z", "2026-01-15", true],
    ["2026-01-15T23:00:00Z", "2026-01-15", false],
  ])("at %s, a Day dated %s counts: %s", (now, day, expected) => {
    expect(isCurrentDay({ day }, new Date(now))).toBe(expected);
  });

  it.each([
    ["2026-03-28T22:59:59Z", "2026-03-28", true],
    ["2026-03-28T23:00:00Z", "2026-03-28", false],
    ["2026-03-29T01:00:00Z", "2026-03-29", true],
    ["2026-03-29T21:59:59Z", "2026-03-29", true],
    ["2026-03-29T22:00:00Z", "2026-03-29", false],
  ])("across the spring switch, at %s a Day dated %s counts: %s", (now, day, expected) => {
    expect(isCurrentDay({ day }, new Date(now))).toBe(expected);
  });

  it.each([
    ["2026-10-24T21:59:59Z", "2026-10-24", true],
    ["2026-10-24T22:00:00Z", "2026-10-24", false],
    ["2026-10-25T01:30:00Z", "2026-10-25", true],
    ["2026-10-25T22:59:59Z", "2026-10-25", true],
    ["2026-10-25T23:00:00Z", "2026-10-25", false],
  ])("across the autumn switch, at %s a Day dated %s counts: %s", (now, day, expected) => {
    expect(isCurrentDay({ day }, new Date(now))).toBe(expected);
  });
});

describe("isCurrentSeason", () => {
  it.each([
    ["2026-09-30T21:59:59Z", "2026-09", true],
    ["2026-09-30T22:00:00Z", "2026-09", false],
    ["2026-09-30T22:00:00Z", "2026-10", true],
    ["2026-12-31T22:59:59Z", "2026-12", true],
    ["2026-12-31T23:00:00Z", "2026-12", false],
    ["2026-12-31T23:00:00Z", "2027-01", true],
  ])("at %s, a read of Season %s counts: %s", (now, season, expected) => {
    expect(isCurrentSeason({ season }, new Date(now))).toBe(expected);
  });
});
