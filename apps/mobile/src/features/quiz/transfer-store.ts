// The device id is a random per-install UUID keying baselines — no fingerprinting.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { INITIAL_TRANSFER_STATE, type TransferState, transferReducer } from "./stats-transfer";

type TransferStore = TransferState & {
  device: string | null;
  // Returns the device id, minting and persisting it on first use.
  ensureDevice: () => string;
  // The Player declined the offer: mark the device world dormant.
  decline: () => void;
  // A transfer landed: the device world moved to the Account, so mark it transferred (not dormant).
  markTransferred: () => void;
  // Sign-out: clear dormancy so a later sign-in re-offers a still-present device world.
  signOut: () => void;
  // Account deletion: forget both flags; the device id survives (per-install, not per-Account).
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
