// The Account world folds into the Device Stats aggregate shape, so shelf rendering never forks.

import type { AppAccountStatsResponse } from "@mentis/contracts/app";
import type { DeviceStats } from "./stats";

// Device totals moved into the Account by a Stats Transfer — one row per (owner, device, Theme).
export type StatBaseline = AppAccountStatsResponse["baselines"][number];

// One shape for both synced and still-pending sessions, so the fold treats them identically.
export type AccountSession = {
  themeId: string;
  themeName: string;
  points: number;
};

function addTotals(
  stats: DeviceStats,
  themeId: string,
  themeName: string,
  totalPoints: number,
  sessionCount: number,
): DeviceStats {
  const previous = stats[themeId] ?? { totalPoints: 0, sessionCount: 0 };
  return {
    ...stats,
    [themeId]: {
      name: themeName,
      totalPoints: previous.totalPoints + totalPoints,
      sessionCount: previous.sessionCount + sessionCount,
    },
  };
}

// Each fold overwrites the captured Theme name, so with oldest-first inputs the newest name wins.
export function foldAccountStats(
  baselines: StatBaseline[],
  synced: AccountSession[],
  pending: AccountSession[],
): DeviceStats {
  let stats: DeviceStats = {};
  for (const baseline of baselines) {
    stats = addTotals(
      stats,
      baseline.themeId,
      baseline.themeName,
      baseline.totalPoints,
      baseline.sessionCount,
    );
  }
  for (const session of [...synced, ...pending]) {
    stats = addTotals(stats, session.themeId, session.themeName, session.points, 1);
  }
  return stats;
}
