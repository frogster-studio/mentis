import type { Category, ThemeWithCount } from "@/types/quiz";
import type { ThemeTally } from "./theme-tallies";

export type ThemeStat = {
  // Captured at record time so home rendering needs no catalog query and works offline.
  name: string;
  totalPoints: number;
  sessionCount: number;
  // Both absent on an entry recorded before bests and Categories were captured.
  bestScore?: number;
  category?: Category;
};

// Keyed by Theme id — only finished Sessions ever write a row.
export type DeviceStats = Record<string, ThemeStat>;

export function recordSession(
  stats: DeviceStats,
  themeId: string,
  name: string,
  category: Category,
  points: number,
): DeviceStats {
  const previous = stats[themeId];
  return {
    ...stats,
    [themeId]: {
      name,
      totalPoints: (previous?.totalPoints ?? 0) + points,
      sessionCount: (previous?.sessionCount ?? 0) + 1,
      bestScore: Math.max(previous?.bestScore ?? 0, points),
      category,
    },
  };
}

// The catalog's Category wins; the captured one stands in for a Theme the catalog no longer holds.
export function deviceTallies(stats: DeviceStats, catalog: ThemeWithCount[]): ThemeTally[] {
  const catalogCategories = new Map(catalog.map((theme) => [theme.id, theme.category]));
  return Object.entries(stats).map(([themeId, stat]) => ({
    themeId,
    themeName: stat.name,
    category: catalogCategories.get(themeId) ?? stat.category ?? null,
    practice: {
      sessionCount: stat.sessionCount,
      totalPoints: stat.totalPoints,
      bestScore: stat.bestScore ?? null,
    },
    competition: { attemptCount: 0, judgedCount: 0, totalPoints: 0, bestScore: null },
  }));
}

// A Paris date, held once however many Sessions finished on it.
export function recordPracticeDay(days: string[], day: string): string[] {
  return days.includes(day) ? days : [...days, day];
}
