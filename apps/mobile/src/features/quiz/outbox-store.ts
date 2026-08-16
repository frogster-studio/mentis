// Survives restarts and sign-out, so a finished session is never lost to timing.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type Outbox, type OutboxEntry, outboxReducer } from "./outbox";

type OutboxStore = {
  entries: Outbox;
  // A finished signed-in session, already carrying its injected id, owner and finish timestamp.
  enqueue: (entry: OutboxEntry) => void;
  // Returns the entries actually removed, so a double-drain seeds the Account world at most once.
  ack: (ids: string[]) => OutboxEntry[];
  // A push rejected because the owner no longer exists: drop every one of that Account's rows.
  discardOwner: (owner: string) => void;
};

export const useOutboxStore = create<OutboxStore>()(
  persist(
    (set, get) => ({
      entries: [],
      enqueue: (entry) =>
        set((state) => ({ entries: outboxReducer(state.entries, { type: "enqueue", entry }) })),
      ack: (ids) => {
        const before = get().entries;
        const wanted = new Set(ids);
        const removed = before.filter((entry) => wanted.has(entry.id));
        set({ entries: outboxReducer(before, { type: "ack", ids }) });
        return removed;
      },
      discardOwner: (owner) =>
        set((state) => ({
          entries: outboxReducer(state.entries, { type: "discardOwner", owner }),
        })),
    }),
    {
      name: "mentis-outbox",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
