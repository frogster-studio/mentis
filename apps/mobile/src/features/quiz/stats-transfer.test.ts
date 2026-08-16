import { describe, expect, it } from "vitest";
import { foldAccountStats } from "./account-stats";
import { type DeviceStats, homeCards } from "./stats";
import {
  buildTransferBaselines,
  INITIAL_TRANSFER_STATE,
  shouldOfferTransfer,
  transferReducer,
} from "./stats-transfer";

const DEVICE = "device-uuid-1";

// A played device world: exactly the shape the Device stats store holds.
const deviceStats: DeviceStats = {
  geo: { name: "Géographie", totalPoints: 50, sessionCount: 3 },
  simpson: { name: "Les Simpson", totalPoints: 35, sessionCount: 1 },
};

describe("shouldOfferTransfer — the offer predicate", () => {
  it("offers when the device world is non-empty, not dormant and not yet transferred", () => {
    expect(shouldOfferTransfer(deviceStats, false, false)).toBe(true);
  });

  it("never offers an empty device world (a fresh install)", () => {
    expect(shouldOfferTransfer({}, false, false)).toBe(false);
  });

  it("never offers a dormant device world (the Player already declined)", () => {
    expect(shouldOfferTransfer(deviceStats, true, false)).toBe(false);
  });

  it("never offers an already-transferred device world (the move is one-time per device)", () => {
    expect(shouldOfferTransfer(deviceStats, false, true)).toBe(false);
  });
});

describe("buildTransferBaselines — the baseline payload", () => {
  it("builds one row per played Theme, carrying the injected device id and the totals", () => {
    expect(buildTransferBaselines(deviceStats, DEVICE)).toStrictEqual([
      { device: DEVICE, themeId: "geo", themeName: "Géographie", totalPoints: 50, sessionCount: 3 },
      {
        device: DEVICE,
        themeId: "simpson",
        themeName: "Les Simpson",
        totalPoints: 35,
        sessionCount: 1,
      },
    ]);
  });

  it("builds nothing from an empty device world", () => {
    expect(buildTransferBaselines({}, DEVICE)).toStrictEqual([]);
  });

  it("mutates none of its input", () => {
    const snapshot = structuredClone(deviceStats);
    buildTransferBaselines(deviceStats, DEVICE);
    expect(deviceStats).toStrictEqual(snapshot);
  });
});

describe("accept — the move conserves the totals exactly once", () => {
  it("folds the built baselines back into the very device world that was moved", () => {
    const baselines = buildTransferBaselines(deviceStats, DEVICE);
    expect(foldAccountStats(baselines, [], [])).toStrictEqual(deviceStats);
  });

  it("carries the Theme Averages across unchanged (the shelf is identical after the move)", () => {
    const baselines = buildTransferBaselines(deviceStats, DEVICE);
    expect(homeCards(foldAccountStats(baselines, [], []))).toStrictEqual(homeCards(deviceStats));
  });
});

describe("transferReducer — move semantics and dormancy", () => {
  it("accepting marks the world transferred and leaves it non-dormant", () => {
    expect(transferReducer(INITIAL_TRANSFER_STATE, { type: "accept" })).toStrictEqual({
      dormant: false,
      transferred: true,
    });
  });

  it("declining marks the device world dormant, keeping it (not transferred)", () => {
    expect(transferReducer(INITIAL_TRANSFER_STATE, { type: "decline" })).toStrictEqual({
      dormant: true,
      transferred: false,
    });
  });

  it("signing out clears dormancy so a later sign-in re-offers a still-present world", () => {
    const declined = transferReducer(INITIAL_TRANSFER_STATE, { type: "decline" });
    expect(transferReducer(declined, { type: "signOut" })).toStrictEqual({
      dormant: false,
      transferred: false,
    });
  });

  it("a sign-out after an accept keeps the world transferred (the home still explains the move)", () => {
    const accepted = transferReducer(INITIAL_TRANSFER_STATE, { type: "accept" });
    expect(transferReducer(accepted, { type: "signOut" })).toStrictEqual({
      dormant: false,
      transferred: true,
    });
  });

  it("resetting after an accept clears transferred (the deleted Account no longer holds the stats)", () => {
    const accepted = transferReducer(INITIAL_TRANSFER_STATE, { type: "accept" });
    expect(transferReducer(accepted, { type: "reset" })).toStrictEqual(INITIAL_TRANSFER_STATE);
  });

  it("resetting after a decline clears dormancy too (a later sign-in re-offers the intact world)", () => {
    const declined = transferReducer(INITIAL_TRANSFER_STATE, { type: "decline" });
    expect(transferReducer(declined, { type: "reset" })).toStrictEqual(INITIAL_TRANSFER_STATE);
  });

  it("mutates none of its input", () => {
    const snapshot = structuredClone(INITIAL_TRANSFER_STATE);
    transferReducer(INITIAL_TRANSFER_STATE, { type: "decline" });
    expect(INITIAL_TRANSFER_STATE).toStrictEqual(snapshot);
  });
});

describe("re-offer after decline", () => {
  it("suppresses the offer after a decline, then re-offers it after a sign-out", () => {
    let state = INITIAL_TRANSFER_STATE;
    const offered = () => shouldOfferTransfer(deviceStats, state.dormant, state.transferred);
    expect(offered()).toBe(true); // offered at sign-in
    state = transferReducer(state, { type: "decline" });
    expect(offered()).toBe(false); // suppressed once declined
    state = transferReducer(state, { type: "signOut" });
    expect(offered()).toBe(true); // re-offered next sign-in
  });
});
