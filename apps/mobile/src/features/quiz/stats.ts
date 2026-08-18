import { SESSION_COUNT_PLURAL, SESSION_COUNT_SINGULAR } from "./constants";

export type ThemeStat = {
  // Captured at record time so home rendering needs no catalog query and works offline.
  name: string;
  totalPoints: number;
  sessionCount: number;
};

// Keyed by Theme id — only finished Sessions ever write a row.
export type DeviceStats = Record<string, ThemeStat>;

// A home shelf entry: a played Theme with its derived Theme Average.
export type HomeCard = {
  id: string;
  name: string;
  average: number;
  sessionCount: number;
};

export function recordSession(
  stats: DeviceStats,
  themeId: string,
  name: string,
  points: number,
): DeviceStats {
  const previous = stats[themeId] ?? { totalPoints: 0, sessionCount: 0 };
  return {
    ...stats,
    [themeId]: {
      name,
      totalPoints: previous.totalPoints + points,
      sessionCount: previous.sessionCount + 1,
    },
  };
}

// Always derived, never stored; precondition: sessionCount ≥ 1.
export function themeAverage(stat: ThemeStat): number {
  return stat.totalPoints / stat.sessionCount;
}

// French decimal formatting: comma separator, at most one decimal, no trailing « ,0 ».
export function formatAverage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
}

export function formatSessionCount(count: number): string {
  return `${count} ${count === 1 ? SESSION_COUNT_SINGULAR : SESSION_COUNT_PLURAL}`;
}

export function homeCards(stats: DeviceStats): HomeCard[] {
  const cards: HomeCard[] = [];
  for (const [id, stat] of Object.entries(stats)) {
    if (stat.sessionCount > 0) {
      cards.push({
        id,
        name: stat.name,
        average: themeAverage(stat),
        sessionCount: stat.sessionCount,
      });
    }
  }
  cards.sort((a, b) => b.average - a.average);
  return cards;
}
