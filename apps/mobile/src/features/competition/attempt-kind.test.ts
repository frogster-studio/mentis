import { describe, expect, it } from "vitest";
import { attemptKindFromParam } from "./attempt-kind";

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
