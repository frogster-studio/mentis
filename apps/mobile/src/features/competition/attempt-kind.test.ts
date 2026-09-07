import type { AppCompetitionDayResponse } from "@mentis/contracts/app";
import { describe, expect, it } from "vitest";
import { attemptKindFromParam, entryAttemptKind } from "./attempt-kind";

describe("attemptKindFromParam", () => {
  it("reads each kind the route can carry", () => {
    expect(attemptKindFromParam("initial")).toBe("initial");
    expect(attemptKindFromParam("replay")).toBe("replay");
    expect(attemptKindFromParam("catchup")).toBe("catchup");
  });

  it("falls back to the initial Attempt on anything else", () => {
    expect(attemptKindFromParam(undefined)).toBe("initial");
    expect(attemptKindFromParam("bonus")).toBe("initial");
    expect(attemptKindFromParam(["replay", "catchup"])).toBe("initial");
  });
});

describe("entryAttemptKind", () => {
  const day = (attempts: AppCompetitionDayResponse["attempts"]): AppCompetitionDayResponse => ({
    day: "2026-08-21",
    replay: false,
    catchup: false,
    attempts,
  });

  it("opens on the initial while the day holds no judged Attempt", () => {
    expect(entryAttemptKind(day([]))).toBe("initial");
  });

  it("opens on the day's best judged Attempt", () => {
    expect(
      entryAttemptKind(
        day([
          { id: "a", kind: "initial", score: 20 },
          { id: "b", kind: "replay", score: 35 },
        ]),
      ),
    ).toBe("replay");
  });

  it("falls back to the initial when the day read failed", () => {
    expect(entryAttemptKind(undefined)).toBe("initial");
  });
});
