import { describe, expect, it } from "vitest";
import { COUNTDOWN_DURATION_MS } from "./constants";
import {
  endTimestamp,
  isExpired,
  remainingFraction,
  remainingMs,
  remainingSeconds,
} from "./countdown";

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

describe("remainingFraction", () => {
  it("is 1 at the start and 0 at expiry", () => {
    expect(remainingFraction(ENDS_AT, T0)).toBe(1);
    expect(remainingFraction(ENDS_AT, ENDS_AT)).toBe(0);
  });

  it("is proportional to the remaining time", () => {
    expect(remainingFraction(ENDS_AT, T0 + COUNTDOWN_DURATION_MS / 2)).toBe(0.5);
  });

  it("clamps to 1 for a now earlier than the question start", () => {
    expect(remainingFraction(ENDS_AT, T0 - 5_000)).toBe(1);
  });
});

describe("isExpired", () => {
  it("flips exactly at the end-timestamp", () => {
    expect(isExpired(ENDS_AT, ENDS_AT - 1)).toBe(false);
    expect(isExpired(ENDS_AT, ENDS_AT)).toBe(true);
    expect(isExpired(ENDS_AT, ENDS_AT + 1)).toBe(true);
  });
});
