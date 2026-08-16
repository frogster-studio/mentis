// The Account world folds into the Device Stats aggregate shape, so shelf rendering never forks.

import type { AppAccountStatsResponse } from "@mentis/contracts/app";
import { type DeviceStats, recordSession } from "./stats";

// Device totals moved into the Account by a Stats Transfer — one row per (owner, device, Theme).
export type StatBaseline = AppAccountStatsResponse["baselines"][number];

// One shape for both synced and still-pending sessions, so the fold treats them identically.
export type AccountSession = {
  themeId: string;
  themeName: string;
  points: number;
};

function addBaseline(stats: DeviceStats, baseline: StatBaseline): DeviceStats {
  const previous = stats[baseline.themeId] ?? { totalPoints: 0, sessionCount: 0 };
  return {
    ...stats,
    [baseline.themeId]: {
      name: baseline.themeName,
      totalPoints: previous.totalPoints + baseline.totalPoints,
      sessionCount: previous.sessionCount + baseline.sessionCount,
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
    stats = addBaseline(stats, baseline);
  }
  for (const session of [...synced, ...pending]) {
    stats = recordSession(stats, session.themeId, session.themeName, session.points);
  }
  return stats;
}
