import { describe, expect, it } from "vitest";
import type { DayAttempt } from "../types/day-attempt";
import { offersCatchUp, offersReplay } from "../utils/day-offers";

const attempt = (kind: DayAttempt["kind"], status: DayAttempt["status"]): DayAttempt => ({
  kind,
  status,
});

describe("offersReplay", () => {
  it("withholds the Replay until the initial Attempt is judged", () => {
    expect(offersReplay([])).toBe(false);
    expect(offersReplay([attempt("initial", "active")])).toBe(false);
    expect(offersReplay([attempt("initial", "finalized")])).toBe(true);
  });

  it("keeps offering the Replay in play, and withdraws it once judged", () => {
    expect(offersReplay([attempt("initial", "finalized"), attempt("replay", "active")])).toBe(true);
    expect(offersReplay([attempt("initial", "finalized"), attempt("replay", "finalized")])).toBe(
      false,
    );
  });
});

describe("offersCatchUp", () => {
  it("offers a Catch-up for an empty yesterday of the same season only", () => {
    expect(offersCatchUp([], true)).toBe(true);
    expect(offersCatchUp([], false)).toBe(false);
  });

  it("withholds it once yesterday holds any judged Attempt", () => {
    expect(offersCatchUp([attempt("initial", "finalized")], true)).toBe(false);
    expect(offersCatchUp([attempt("catchup", "finalized")], true)).toBe(false);
  });

  it("keeps offering the Catch-up still in play, so a crashed phone finds its way back", () => {
    expect(offersCatchUp([attempt("catchup", "active")], true)).toBe(true);
  });
});
