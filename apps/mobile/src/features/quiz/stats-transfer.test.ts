import { describe, expect, it } from "vitest";
import { type DeviceStats, deviceTallies } from "./stats";
import {
  buildTransferBaselines,
  buildTransferPracticeDays,
  INITIAL_TRANSFER_STATE,
  shouldOfferTransfer,
  transferReducer,
} from "./stats-transfer";

const DEVICE = "device-uuid-1";

const NATURE = {
  id: "nature",
  name: "Nature",
  color: "#2e7d32",
  secondaryColor: "#e8f5e9",
  icon: "park",
};

// A played device world: one Theme recorded with its best, one recorded before bests were kept.
const deviceStats: DeviceStats = {
  geo: { name: "Géographie", totalPoints: 50, sessionCount: 3, bestScore: 30, category: NATURE },
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
  it("builds one row per played Theme, carrying the injected device id, the totals and the best, null when unknown", () => {
    expect(buildTransferBaselines(deviceStats, DEVICE)).toStrictEqual([
      {
        device: DEVICE,
        themeId: "geo",
        themeName: "Géographie",
        totalPoints: 50,
        sessionCount: 3,
        bestScore: 30,
      },
      {
        device: DEVICE,
        themeId: "simpson",
        themeName: "Les Simpson",
        totalPoints: 35,
        sessionCount: 1,
        bestScore: null,
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

describe("buildTransferPracticeDays — the practice-days payload", () => {
  it("builds one row per device day, carrying the injected device id", () => {
    expect(buildTransferPracticeDays(["2026-04-01", "2026-04-02"], DEVICE)).toStrictEqual([
      { device: DEVICE, day: "2026-04-01" },
      { device: DEVICE, day: "2026-04-02" },
    ]);
  });

  it("builds nothing from a device that never finished a session", () => {
    expect(buildTransferPracticeDays([], DEVICE)).toStrictEqual([]);
  });
});

describe("accept — the move conserves the totals exactly once", () => {
  it("deposits each Theme's practice tally exactly, best included", () => {
    const deposited = buildTransferBaselines(deviceStats, DEVICE).map(
      ({ themeId, sessionCount, totalPoints, bestScore }) => ({
        themeId,
        practice: { sessionCount, totalPoints, bestScore },
      }),
    );
    const moved = deviceTallies(deviceStats, []).map(({ themeId, practice }) => ({
      themeId,
      practice,
    }));
    expect(deposited).toStrictEqual(moved);
  });
});

describe("transferReducer — move semantics and dormancy", () => {
  it("accepting marks the world transferred and leaves it non-dormant", () => {
    expect(transferReducer(INITIAL_TRANSFER_STATE, { type: "accept" })).toStrictEqual({
      dormant: false,
      transferred: true,
      dismissed: false,
    });
  });

  it("declining marks the device world dormant, keeping it (not transferred)", () => {
    expect(transferReducer(INITIAL_TRANSFER_STATE, { type: "decline" })).toStrictEqual({
      dormant: true,
      transferred: false,
      dismissed: false,
    });
  });

  it("signing out clears dormancy so a later sign-in re-offers a still-present world", () => {
    const declined = transferReducer(INITIAL_TRANSFER_STATE, { type: "decline" });
    expect(transferReducer(declined, { type: "signOut" })).toStrictEqual({
      dormant: false,
      transferred: false,
      dismissed: false,
    });
  });

  it("a sign-out after an accept keeps the world transferred (the home still explains the move)", () => {
    const accepted = transferReducer(INITIAL_TRANSFER_STATE, { type: "accept" });
    expect(transferReducer(accepted, { type: "signOut" })).toStrictEqual({
      dormant: false,
      transferred: true,
      dismissed: false,
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

describe("dismiss — the moved-stats notice is read once, not re-read forever", () => {
  const accepted = transferReducer(INITIAL_TRANSFER_STATE, { type: "accept" });
  const dismissed = transferReducer(accepted, { type: "dismiss" });

  it("dismissing marks the notice read, touching neither dormancy nor the move", () => {
    expect(dismissed).toStrictEqual({ dormant: false, transferred: true, dismissed: true });
  });

  it("survives a sign-out — the fact it states has not changed", () => {
    expect(transferReducer(dismissed, { type: "signOut" })).toStrictEqual({
      dormant: false,
      transferred: true,
      dismissed: true,
    });
  });

  it("survives a decline (a later sign-in that declines a fresh device world)", () => {
    expect(transferReducer(dismissed, { type: "decline" })).toStrictEqual({
      dormant: true,
      transferred: true,
      dismissed: true,
    });
  });

  it("comes back after an account deletion, then a fresh transfer", () => {
    const deleted = transferReducer(dismissed, { type: "reset" });
    expect(deleted).toStrictEqual(INITIAL_TRANSFER_STATE);
    expect(transferReducer(deleted, { type: "accept" })).toStrictEqual({
      dormant: false,
      transferred: true,
      dismissed: false,
    });
  });

  it("mutates none of its input", () => {
    const snapshot = structuredClone(accepted);
    transferReducer(accepted, { type: "dismiss" });
    expect(accepted).toStrictEqual(snapshot);
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
