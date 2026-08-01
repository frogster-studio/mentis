// The persisted outbox: a zustand store, backed by AsyncStorage, that drives the pure outbox
// reducer (seam) alongside the Device stats store. It survives app restarts and sign-out — rows
// stay owner-tagged so a finished session is never lost to timing, only cleared when acked, when
// their Account is deleted, or when a push proves the owner is gone. All queue logic lives in the
// pure `outbox` module; this shell only holds the array and injects nothing.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type Outbox, type OutboxEntry, outboxReducer } from "./outbox";

type OutboxStore = {
  entries: Outbox;
  // A finished signed-in session, already carrying its injected id, owner and finish timestamp.
  enqueue: (entry: OutboxEntry) => void;
  // A landed push. Returns the entries actually removed, so the caller can hand exactly those —
  // and only those — to the cached Account world, seeding a double-drain at most once.
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
