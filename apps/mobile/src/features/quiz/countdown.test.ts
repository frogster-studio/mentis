import { describe, expect, it } from "vitest";
import { COUNTDOWN_DURATION_MS } from "./constants";
import { elapsedMs, endTimestamp, isExpired, remainingMs, remainingSeconds } from "./countdown";

const T0 = 1_760_000_000_000;
const ENDS_AT = T0 + COUNTDOWN_DURATION_MS;

describe("endTimestamp", () => {
  it("anchors the Countdown a full duration after now", () => {
    expect(endTimestamp(T0)).toBe(T0 + 25_000);
  });
});

describe("remainingMs", () => {
  it("is the full duration when the question is shown", () => {
    expect(remainingMs(ENDS_AT, T0)).toBe(COUNTDOWN_DURATION_MS);
  });

  it("decreases with the wall clock", () => {
    expect(remainingMs(ENDS_AT, T0 + 10_000)).toBe(15_000);
  });

  it("clamps to 0 once the end-timestamp has passed", () => {
    expect(remainingMs(ENDS_AT, ENDS_AT)).toBe(0);
    expect(remainingMs(ENDS_AT, ENDS_AT + 60_000)).toBe(0);
  });
});

describe("remainingSeconds", () => {
  it("shows 25 at the start", () => {
    expect(remainingSeconds(ENDS_AT, T0)).toBe(25);
  });

  it("rounds up: a started second is still displayed", () => {
    expect(remainingSeconds(ENDS_AT, T0 + 1)).toBe(25);
    expect(remainingSeconds(ENDS_AT, T0 + 999)).toBe(25);
    expect(remainingSeconds(ENDS_AT, T0 + 1000)).toBe(24);
    expect(remainingSeconds(ENDS_AT, ENDS_AT - 1)).toBe(1);
  });

  it("reaches 0 exactly at expiry", () => {
    expect(remainingSeconds(ENDS_AT, ENDS_AT)).toBe(0);
    expect(remainingSeconds(ENDS_AT, ENDS_AT + 1)).toBe(0);
  });
});

describe("isExpired", () => {
  it("flips exactly at the end-timestamp", () => {
    expect(isExpired(ENDS_AT, ENDS_AT - 1)).toBe(false);
    expect(isExpired(ENDS_AT, ENDS_AT)).toBe(true);
    expect(isExpired(ENDS_AT, ENDS_AT + 1)).toBe(true);
  });
});

describe("elapsedMs", () => {
  it("is 0 the instant the question is shown", () => {
    expect(elapsedMs(ENDS_AT, T0)).toBe(0);
  });

  it("stamps how long the Question stood before the answer", () => {
    expect(elapsedMs(ENDS_AT, T0 + 9_000)).toBe(9_000);
  });

  it("caps at the full duration, however late the expiry is noticed", () => {
    expect(elapsedMs(ENDS_AT, ENDS_AT)).toBe(COUNTDOWN_DURATION_MS);
    expect(elapsedMs(ENDS_AT, ENDS_AT + 60_000)).toBe(COUNTDOWN_DURATION_MS);
  });

  it("never goes negative when the wall clock jumps backwards", () => {
    expect(elapsedMs(ENDS_AT, T0 - 5_000)).toBe(0);
  });
});
