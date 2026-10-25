import { describe, expect, it } from "vitest";
import { quickHomeQuestionChoices, type ShuffleableQuestion, squareChoices } from "./shuffle";

function question(answer: string, wrongChoices: string[]): ShuffleableQuestion {
  return { answer, wrongChoices };
}

const PARIS = question("Paris", ["Lyon", "Marseille", "Bordeaux"]);

function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

function scriptedRng(...values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index];
    index += 1;
    return value;
  };
}

describe("squareChoices", () => {
  it("returns the Canonical Answer plus the 3 wrong choices, four in all", () => {
    const choices = squareChoices(PARIS, seededRng(42));
    expect(choices).toHaveLength(4);
    expect(choices.slice().sort()).toStrictEqual(["Bordeaux", "Lyon", "Marseille", "Paris"]);
  });

  it("always contains the Canonical Answer whatever the RNG", () => {
    for (let seed = 0; seed < 20; seed += 1) {
      expect(squareChoices(PARIS, seededRng(seed))).toContain("Paris");
    }
  });

  it("keeps input order when the RNG always returns 0", () => {
    expect(squareChoices(PARIS, () => 0)).toStrictEqual(["Paris", "Lyon", "Marseille", "Bordeaux"]);
  });

  it("is deterministic for a given RNG seed", () => {
    expect(squareChoices(PARIS, seededRng(2026))).toStrictEqual(
      squareChoices(PARIS, seededRng(2026)),
    );
  });

  it("produces different orders for different seeds", () => {
    const first = squareChoices(PARIS, seededRng(1));
    const second = squareChoices(PARIS, seededRng(7));
    expect(first).not.toStrictEqual(second);
  });

  it("does not mutate the question", () => {
    const snapshot = structuredClone(PARIS);
    squareChoices(PARIS, seededRng(13));
    expect(PARIS).toStrictEqual(snapshot);
  });
});

describe("quickHomeQuestionChoices", () => {
  it("returns exactly the Canonical Answer and one of the three wrong choices", () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const choices = quickHomeQuestionChoices(PARIS, seededRng(seed));
      expect(choices).toHaveLength(2);
      expect(choices).toContain("Paris");
      expect(PARIS.wrongChoices).toContain(choices.find((choice) => choice !== "Paris"));
    }
  });

  it.each([
    [0, "Lyon"],
    [0.4, "Marseille"],
    [0.99, "Bordeaux"],
  ])("draws each wrong choice: rng %s picks %s", (draw, wrongChoice) => {
    expect(quickHomeQuestionChoices(PARIS, scriptedRng(draw, 0))).toStrictEqual([
      "Paris",
      wrongChoice,
    ]);
  });

  it("puts the Canonical Answer on the left or on the right", () => {
    expect(quickHomeQuestionChoices(PARIS, scriptedRng(0, 0.49))).toStrictEqual(["Paris", "Lyon"]);
    expect(quickHomeQuestionChoices(PARIS, scriptedRng(0, 0.5))).toStrictEqual(["Lyon", "Paris"]);
  });

  it("does not mutate the question", () => {
    const snapshot = structuredClone(PARIS);
    quickHomeQuestionChoices(PARIS, seededRng(13));
    expect(PARIS).toStrictEqual(snapshot);
  });
});
