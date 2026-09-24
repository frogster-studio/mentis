import { describe, expect, it } from "vitest";
import { catchupTimeLeft, msUntilParisMidnight } from "./catchup-deadline";

describe("msUntilParisMidnight", () => {
  it("counts down to the next Paris midnight in summer time", () => {
    expect(msUntilParisMidnight(new Date("2026-09-23T20:15:00Z"))).toBe(105 * 60 * 1000);
  });
  it("counts down to the next Paris midnight in winter time", () => {
    expect(msUntilParisMidnight(new Date("2026-12-01T21:00:00Z"))).toBe(2 * 60 * 60 * 1000);
  });
  it("starts a full day at the boundary", () => {
    expect(msUntilParisMidnight(new Date("2026-09-23T22:00:00Z"))).toBe(24 * 60 * 60 * 1000);
  });
  it("accounts for the autumn offset change", () => {
    expect(msUntilParisMidnight(new Date("2026-10-24T22:00:00Z"))).toBe(25 * 60 * 60 * 1000);
  });
});

describe("catchupTimeLeft", () => {
  it("splits hours and minutes", () => {
    expect(catchupTimeLeft(new Date("2026-09-23T20:15:00Z"))).toEqual({ hours: 1, minutes: 45 });
  });
  it("rounds the seconds up to the next minute", () => {
    expect(catchupTimeLeft(new Date("2026-09-23T20:15:30Z"))).toEqual({ hours: 1, minutes: 45 });
    expect(catchupTimeLeft(new Date("2026-09-23T21:59:30Z"))).toEqual({ hours: 0, minutes: 1 });
  });
});
