// Device stats (seam 4 of the PRD's testing decisions): pure accumulation of finished
// Quiz Session scores per Theme, the derived Theme Average, and its French decimal
// formatting. Persistence (AsyncStorage) lives in the store — this module stays pure.

export type ThemeStat = {
  // Captured at record time so home rendering needs no catalog query and works offline.
  name: string;
  totalPoints: number;
  sessionCount: number;
};

// Keyed by Theme id. Only finished sessions ever land here (Abandoned Sessions never
// write — the caller guards on the finished status).
export type DeviceStats = Record<string, ThemeStat>;

// A home shelf entry: a played Theme with its derived Theme Average.
export type HomeCard = {
  id: string;
  name: string;
  average: number;
};

// Fold one finished session's total into the running per-theme stat, capturing the Theme
// name at record time. Pure: returns a fresh map, never mutates the input.
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

// Theme Average is always derived, never stored: total ÷ count. Precondition:
// sessionCount ≥ 1 (only called for played Themes).
export function themeAverage(stat: ThemeStat): number {
  return stat.totalPoints / stat.sessionCount;
}

// French decimal formatting: comma separator, at most one decimal, no trailing « ,0 ».
// « 35 » (not « 35,0 »), « 17,5 », « 16,7 » (from 16.66…).
export function formatAverage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
}

// Build the home shelf from device stats alone: one card per played Theme (name captured
// at record time), sorted by Theme Average descending. Unplayed Themes never appear. Pure.
export function homeCards(stats: DeviceStats): HomeCard[] {
  const cards: HomeCard[] = [];
  for (const [id, stat] of Object.entries(stats)) {
    if (stat.sessionCount > 0) {
      cards.push({ id, name: stat.name, average: themeAverage(stat) });
    }
  }
  cards.sort((a, b) => b.average - a.average);
  return cards;
}
