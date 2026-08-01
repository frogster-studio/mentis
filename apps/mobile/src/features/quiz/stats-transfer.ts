// Stats Transfer seam (per ADR 0003): the one-time, consented move of a device's pre-account
// Device Stats into an Account at sign-in. A pure seam like the outbox — no time, no network, no
// auth, no store: the device world and the dormant flag go in; the offer decision, the baseline
// payload and the next dormancy state come out.
//
// A move, not a copy: accepting builds one baseline row per played Theme (keyed per device so the
// insert is idempotent) while the caller empties the device world; declining marks the world dormant
// so the same sign-in never re-offers it, until a sign-out makes it live again for a later sign-in.

import type { StatBaseline } from "./account-stats";
import type { DeviceStats } from "./stats";

// One baseline row built for the transfer: exactly a fold-input StatBaseline (a Device Stats Theme
// aggregate) tagged with the injected device id. The owner is added by the network shell at insert
// time (auth-scoped), so the pure seam knows the device, never the Account — the row maps 1:1 onto a
// `stat_baselines` row minus its owner, and folds straight back into the Account as its StatBaseline.
export type TransferBaseline = StatBaseline & { device: string };

// The transfer's small local state, driven through the reducer below and persisted by the store.
// `dormant`: the Player declined the current device world, so it is not re-offered until sign-out.
// `transferred`: a transfer was accepted on this device, so the signed-out home explains that the
// stats now live on the Account instead of looking like a never-played blank shelf.
export type TransferState = {
  dormant: boolean;
  transferred: boolean;
};

export const INITIAL_TRANSFER_STATE: TransferState = { dormant: false, transferred: false };

type TransferAction =
  // Baselines landed: the caller empties the device world; the world is now transferred, not dormant.
  | { type: "accept" }
  // The Player declined: keep the device world intact but dormant, so this sign-in never re-offers it.
  | { type: "decline" }
  // Sign-out: the device world is live again, so a later sign-in re-offers a still-present world.
  | { type: "signOut" }
  // The Account was deleted: both flags described a relationship to an Account that no longer exists,
  // so drop them. Unlike sign-out, `transferred` clears too — the stats did not move to a compte, they
  // were erased, so the signed-out home must show the plain device world, not the "now on your compte"
  // note. The persisted device id lives in the store, not here, so it is untouched.
  | { type: "reset" };

// Constructs each next state explicitly (no spread), so the output is exactly a TransferState even
// when the store hands in its whole object as `state`. Pure: never mutates its input.
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

// The offer predicate: offer the transfer exactly when the device world holds at least one played
// Theme, the Player has not declined it (dormant), and no transfer has already moved this device
// (transferred). The transfer is a one-time pre-account bridge per device: baselines are keyed
// insert-if-absent per (owner, device, Theme), so a second move of the same device could only
// collide with the first — re-offering it would silently drop the replayed sessions. After a
// transfer the Player plays signed in (sessions sync); solo play stays in the device world.
export function shouldOfferTransfer(
  stats: DeviceStats,
  dormant: boolean,
  transferred: boolean,
): boolean {
  return !dormant && !transferred && hasPlayedTheme(stats);
}

// Build the baseline payload from the whole device world: one row per played Theme, each carrying
// the injected device id so the insert is insert-if-absent per (owner, device, Theme). Folding these
// baselines back reproduces the device world's per-Theme totals exactly — the move conserves points
// and counts, and the per-device key means a retried transfer can never double-count. Pure.
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
