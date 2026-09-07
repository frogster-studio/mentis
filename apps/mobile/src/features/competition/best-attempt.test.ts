import type { AppCompetitionAttemptKind, AppCompetitionDayAttempt } from "@mentis/contracts/app";
import { describe, expect, it } from "vitest";
import { bestAttempt } from "./best-attempt";

const attempt = (kind: AppCompetitionAttemptKind, score: number): AppCompetitionDayAttempt => ({
  id: `${kind}-id`,
  kind,
  score,
});

describe("bestAttempt", () => {
  it("holds nothing on a day with no judged Attempt", () => {
    expect(bestAttempt([])).toBeUndefined();
  });

  it("is the single Attempt the day holds", () => {
    expect(bestAttempt([attempt("initial", 12)])).toEqual(attempt("initial", 12));
  });

  it("picks the higher score whichever kind holds it", () => {
    expect(bestAttempt([attempt("initial", 20), attempt("replay", 35)])?.kind).toBe("replay");
    expect(bestAttempt([attempt("initial", 40), attempt("replay", 35)])?.kind).toBe("initial");
  });

  it("lets the first issued stand on a tie", () => {
    expect(bestAttempt([attempt("initial", 25), attempt("replay", 25)])?.kind).toBe("initial");
  });
});
