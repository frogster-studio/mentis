import { describe, expect, it } from "vitest";
import { monthTimeLeft, sessionNumber } from "./season-calendar";

describe("sessionNumber", () => {
  it.each([
    ["2026-08-01T12:00:00Z", 0],
    ["2026-08-31T22:00:00Z", 1],
    ["2027-01-01T12:00:00Z", 5],
    ["2027-08-01T12:00:00Z", 12],
    ["2026-07-01T12:00:00Z", 0],
  ])("counts elapsed Paris months at %s", (date, expected) => {
    expect(sessionNumber(new Date(date))).toBe(expected);
  });
});

describe("monthTimeLeft", () => {
  it("counts down to Paris midnight at the next month", () => {
    expect(monthTimeLeft(new Date("2026-09-27T03:00:00Z"))).toEqual({
      days: 3,
      hours: 19,
      minutes: 0,
    });
  });
  it("keeps the last minute in the current month", () => {
    expect(monthTimeLeft(new Date("2026-09-30T21:59:00Z"))).toEqual({
      days: 0,
      hours: 0,
      minutes: 1,
    });
  });
  it("starts a new countdown at the boundary", () => {
    expect(monthTimeLeft(new Date("2026-08-31T22:00:00Z"))).toEqual({
      days: 30,
      hours: 0,
      minutes: 0,
    });
  });
  it("accounts for the autumn offset change", () => {
    expect(monthTimeLeft(new Date("2026-10-01T00:00:00Z"))).toEqual({
      days: 30,
      hours: 23,
      minutes: 0,
    });
  });
  it("handles leap years and year rollover", () => {
    expect(monthTimeLeft(new Date("2028-02-28T23:00:00Z"))).toEqual({
      days: 1,
      hours: 0,
      minutes: 0,
    });
    expect(monthTimeLeft(new Date("2026-12-31T22:00:00Z"))).toEqual({
      days: 0,
      hours: 1,
      minutes: 0,
    });
  });
});
