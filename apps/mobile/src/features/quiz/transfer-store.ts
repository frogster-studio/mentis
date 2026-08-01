// The Stats Transfer's small persisted local state — a zustand store alongside the Device stats and
// outbox stores. It holds the per-install device id (a random UUID minted once and persisted, used
// solely to key baselines — no fingerprinting) and the pure transfer state (dormant / transferred).
// Every state transition runs through the pure `transferReducer` seam; this shell only persists and
// mints the device id, injecting nothing else.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { INITIAL_TRANSFER_STATE, type TransferState, transferReducer } from "./stats-transfer";

type TransferStore = TransferState & {
  // Minted lazily on the first transfer and persisted, so a device keys its baselines by one stable
  // id for the life of the install. `null` until then.
  device: string | null;
  // Returns the device id, minting and persisting it on first use.
  ensureDevice: () => string;
  // The Player declined the offer: mark the device world dormant.
  decline: () => void;
  // A transfer landed: the device world moved to the Account, so mark it transferred (not dormant).
  markTransferred: () => void;
  // Sign-out: clear dormancy so a later sign-in re-offers a still-present device world.
  signOut: () => void;
  // The Account was deleted: forget both flags (the device id survives — it is per-install, not
  // per-Account). The signed-out home then renders the plain device world again instead of the
  // "stats now on your compte" note, which would point at a compte that no longer exists.
  reset: () => void;
};

export const useTransferStore = create<TransferStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_TRANSFER_STATE,
      device: null,
      ensureDevice: () => {
        const existing = get().device;
        if (existing) {
          return existing;
        }
        const device = randomUUID();
        set({ device });
        return device;
      },
      decline: () => set((state) => transferReducer(state, { type: "decline" })),
      markTransferred: () => set((state) => transferReducer(state, { type: "accept" })),
      signOut: () => set((state) => transferReducer(state, { type: "signOut" })),
      reset: () => set((state) => transferReducer(state, { type: "reset" })),
    }),
    {
      name: "mentis-transfer",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
