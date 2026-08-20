import { squareChoices } from "@mentis/answer-matching";
import { describe, expect, it } from "vitest";
import { seededRng } from "./seeded-rng";

const draw = (seed: string, count: number) => {
  const rng = seededRng(seed);
  return Array.from({ length: count }, () => rng());
};

describe("seededRng", () => {
  it("repeats itself for one seed and diverges for another", () => {
    expect(draw("attempt:q1", 5)).toEqual(draw("attempt:q1", 5));
    expect(draw("attempt:q2", 5)).not.toEqual(draw("attempt:q1", 5));
  });

  it("stays inside [0, 1)", () => {
    for (const value of draw("attempt:q1", 200)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("shuffles one Question's Square choices the same way every time", () => {
    const question = { answer: "Paris", wrongChoices: ["Lyon", "Nice", "Brest"] };
    const first = squareChoices(question, seededRng("attempt:q1"));
    expect(squareChoices(question, seededRng("attempt:q1"))).toEqual(first);
    expect(new Set(first)).toEqual(new Set(["Paris", "Lyon", "Nice", "Brest"]));
  });
});
