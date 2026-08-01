import { describe, expect, it } from "vitest";
import { PLAY_LABEL } from "./constants";

describe("quiz constants", () => {
  it("exposes non-empty French UI copy", () => {
    expect(PLAY_LABEL).toBe("Jouer");
  });
});
