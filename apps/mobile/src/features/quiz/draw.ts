// Uniform partial Fisher–Yates over the eligible pool — deterministic under the injected RNG.

import type { ThemeWithCount } from "@/types/quiz";
import { DRAW_SIZE, MIN_QUESTIONS_PER_THEME } from "./constants";

// `rng` returns a number in [0, 1), like Math.random.
export function drawThemes(themes: ThemeWithCount[], rng: () => number): ThemeWithCount[] {
  const pool = themes.filter((theme) => theme.questionCount >= MIN_QUESTIONS_PER_THEME);
  const size = Math.min(DRAW_SIZE, pool.length);
  for (let i = 0; i < size; i += 1) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, size);
}
