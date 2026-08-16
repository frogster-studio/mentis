// A move, not a copy: accepting builds baselines while the caller empties the device world.

import type { StatBaseline } from "./account-stats";
import type { DeviceStats } from "./stats";

// The owner is added at insert time, so the pure seam knows the device, never the Account.
export type TransferBaseline = StatBaseline & { device: string };

export type TransferState = {
  // The Player declined — cleared only at sign-out.
  dormant: boolean;
  // Lets the signed-out home explain the moved stats.
  transferred: boolean;
};

export const INITIAL_TRANSFER_STATE: TransferState = { dormant: false, transferred: false };

type TransferAction =
  // Baselines landed: the caller empties the device world, now transferred rather than dormant.
  | { type: "accept" }
  // The Player declined: the device world stays intact but dormant, never re-offered this sign-in.
  | { type: "decline" }
  // Sign-out: the device world is live again, so a later sign-in re-offers a still-present world.
  | { type: "signOut" }
  // Account deletion: unlike sign-out, transferred clears too — the stats were erased, not moved.
  | { type: "reset" };

// No spread: the store hands in its whole object, and the output must be exactly a TransferState.
export function transferReducer(state: TransferState, action: TransferAction): TransferState {
  switch (action.type) {
    case "accept":
      return { dormant: false, transferred: true };
    case "decline":
      return { dormant: true, transferred: state.transferred };
    case "signOut":
      return { dormant: false, transferred: state.transferred };
    case "reset":
      return { dormant: false, transferred: false };
  }
}

// One-time per device: a second move would collide with the first insert and silently drop rows.
export function shouldOfferTransfer(
  stats: DeviceStats,
  dormant: boolean,
  transferred: boolean,
): boolean {
  return !dormant && !transferred && hasPlayedTheme(stats);
}

// Keyed per (owner, device, Theme) insert-if-absent, so a retried transfer can never double-count.
export function buildTransferBaselines(stats: DeviceStats, device: string): TransferBaseline[] {
  const baselines: TransferBaseline[] = [];
  for (const [themeId, stat] of Object.entries(stats)) {
    if (stat.sessionCount > 0) {
      baselines.push({
        device,
        themeId,
        themeName: stat.name,
        totalPoints: stat.totalPoints,
        sessionCount: stat.sessionCount,
      });
    }
  }
  return baselines;
}

function hasPlayedTheme(stats: DeviceStats): boolean {
  return Object.values(stats).some((stat) => stat.sessionCount > 0);
}
