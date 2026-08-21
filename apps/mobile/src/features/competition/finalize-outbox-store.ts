// Survives a kill, so an Attempt played in airplane mode still reaches the judge on reconnect.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type FinalizeOutbox, finalizeOutboxReducer, type QueuedFinalize } from "./finalize-outbox";

type FinalizeOutboxStore = {
  entries: FinalizeOutbox;
  enqueue: (queued: QueuedFinalize) => void;
  ack: (attemptId: string) => void;
  discardOwner: (owner: string) => void;
};

export const useFinalizeOutboxStore = create<FinalizeOutboxStore>()(
  persist(
    (set) => ({
      entries: [],
      enqueue: (queued) =>
        set((state) => ({
          entries: finalizeOutboxReducer(state.entries, { type: "enqueue", queued }),
        })),
      ack: (attemptId) =>
        set((state) => ({
          entries: finalizeOutboxReducer(state.entries, { type: "ack", attemptId }),
        })),
      discardOwner: (owner) =>
        set((state) => ({
          entries: finalizeOutboxReducer(state.entries, { type: "discardOwner", owner }),
        })),
    }),
    {
      name: "mentis-competition-outbox",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
