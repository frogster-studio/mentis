// Account Stats fold (the Account world's counterpart to the Device Stats fold in stats.ts):
// baselines + synced sessions + still-pending local sessions folded into the exact same
// per-Theme aggregate shape the Device world uses, so the existing average derivation and
// home-card construction render the Account world untouched. Account Stats are always derived
// here, never stored.
//
// Pure and injectable: no time, no network, no auth — the inputs are the whole world.

import type { AppAccountStatsResponse } from "@mentis/contracts/app";
import { type DeviceStats, recordSession } from "./stats";

// A pre-account baseline: the Device Stats totals moved into the Account by a Stats Transfer,
// one row per (owner, device, Theme). Several devices can carry the same Theme id — the fold
// sums their totals. The Theme name is captured, so the row survives a catalog rotation. Taken
// from the contract: this is the wire shape, so it has one home.
export type StatBaseline = AppAccountStatsResponse["baselines"][number];

// One finished Quiz Session as it lives in the Account: a single session's points under the
// Theme name captured when it was recorded. The same shape describes a session already synced
// to the server and one still waiting in the local outbox — the fold treats them identically.
export type AccountSession = {
  themeId: string;
  themeName: string;
  points: number;
};

// Add a baseline's aggregate totals into the running per-Theme stat (mirrors recordSession, but
// folds a whole aggregate rather than one session). Pure: returns a fresh map.
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

// Fold the whole Account world into the per-Theme aggregate shape. Baselines first, then synced
// sessions, then the still-pending overlay — each fold overwrites the captured Theme name, so the
// most recently captured name wins (callers pass sessions oldest-first). Sessions reuse the very
// same recordSession accumulator as the Device world. Pure: mutates none of its inputs.
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
