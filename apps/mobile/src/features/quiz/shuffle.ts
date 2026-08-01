// Carré choice shuffle (seam 3-adjacent, same injectable-RNG discipline as the Draw):
// pure and deterministic under an injected RNG. The 2×2 grid shown when a Player bails
// to Carré is the Canonical Answer plus its 3 wrong choices, positions randomized once.

import type { Question } from "@/types/quiz";

export type ShuffleableQuestion = Pick<Question, "answer" | "wrongChoices">;

// `rng` returns a number in [0, 1), like Math.random. Uniform partial Fisher–Yates
// over the full array, matching the Draw's idiom.
export function squareChoices(question: ShuffleableQuestion, rng: () => number): string[] {
  const choices = [question.answer, ...question.wrongChoices];
  for (let i = 0; i < choices.length - 1; i += 1) {
    const j = i + Math.floor(rng() * (choices.length - i));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}
