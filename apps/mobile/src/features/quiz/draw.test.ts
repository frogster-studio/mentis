import { describe, expect, it } from "vitest";
import type { ThemeWithCount } from "@/types/quiz";
import { DRAW_SIZE, MIN_QUESTIONS_PER_THEME } from "./constants";
import { drawThemes } from "./draw";

function theme(id: string, questionCount = 20): ThemeWithCount {
  return {
    id,
    name: `Thème ${id}`,
    imageUrl: `https://cdn.example.com/${id}.webp`,
    questionCount,
    category: { id: "nature", name: "Nature", color: "#2e7d32", icon: "park" },
  };
}

function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

// A pool larger than DRAW_SIZE so the draw genuinely subsamples.
const TWELVE_ELIGIBLE = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"].map((id) =>
  theme(id),
);

describe("drawThemes", () => {
  it("returns DRAW_SIZE distinct themes from the eligible pool", () => {
    const draw = drawThemes(TWELVE_ELIGIBLE, seededRng(42));
    expect(draw).toHaveLength(DRAW_SIZE);
    expect(new Set(draw.map((t) => t.id)).size).toBe(DRAW_SIZE);
    for (const drawn of draw) {
      expect(TWELVE_ELIGIBLE.map((t) => t.id)).toContain(drawn.id);
    }
  });

  it("excludes themes with fewer than the minimum linked questions", () => {
    const themes = [
      theme("eligible-1"),
      theme("too-small-1", MIN_QUESTIONS_PER_THEME - 1),
      theme("eligible-2"),
      theme("too-small-2", 0),
      theme("eligible-3"),
    ];
    const draw = drawThemes(themes, seededRng(7));
    expect(draw.map((t) => t.id).sort()).toStrictEqual(["eligible-1", "eligible-2", "eligible-3"]);
  });

  it("treats exactly the minimum count as eligible", () => {
    const themes = [theme("boundary", MIN_QUESTIONS_PER_THEME)];
    expect(drawThemes(themes, seededRng(1))).toStrictEqual(themes);
  });

  it("keeps the pool order when the RNG always returns 0", () => {
    const draw = drawThemes(TWELVE_ELIGIBLE, () => 0);
    expect(draw.map((t) => t.id)).toStrictEqual(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]);
  });

  it("is deterministic for a given RNG seed", () => {
    const first = drawThemes(TWELVE_ELIGIBLE, seededRng(2026));
    const second = drawThemes(TWELVE_ELIGIBLE, seededRng(2026));
    expect(first).toStrictEqual(second);
  });

  it("produces different draws for different RNG seeds", () => {
    const first = drawThemes(TWELVE_ELIGIBLE, seededRng(1));
    const second = drawThemes(TWELVE_ELIGIBLE, seededRng(2));
    expect(first.map((t) => t.id)).not.toStrictEqual(second.map((t) => t.id));
  });

  it("returns every eligible theme when fewer than DRAW_SIZE are eligible", () => {
    const three = [theme("a"), theme("b"), theme("c")];
    const draw = drawThemes(three, seededRng(5));
    expect(draw.map((t) => t.id).sort()).toStrictEqual(["a", "b", "c"]);
  });

  it("returns an empty draw when nothing is eligible", () => {
    const themes = [theme("tiny", 3)];
    expect(drawThemes(themes, seededRng(9))).toStrictEqual([]);
  });

  it("does not mutate the input list", () => {
    const themes = ["a", "b", "c", "d", "e"].map((id) => theme(id));
    const snapshot = structuredClone(themes);
    drawThemes(themes, seededRng(13));
    expect(themes).toStrictEqual(snapshot);
  });
});
