import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  type AnecdoteDaySet,
  dismissTopAnecdote,
  restoreDaySet,
  type StoredAnecdoteDaySet,
} from "./day-set";

type AnecdoteStore = {
  // No draw leaves before this, or a relaunch would re-request a day already stored.
  hasHydrated: boolean;
  daySet: AnecdoteDaySet | null;
  land: (daySet: AnecdoteDaySet) => void;
  // Recorded at the tap, so an app killed mid-animation resumes on the next Anecdote.
  dismiss: () => void;
};

export const useAnecdoteStore = create<AnecdoteStore>()(
  persist(
    (set) => ({
      hasHydrated: false,
      daySet: null,
      land: (daySet) => set({ daySet }),
      dismiss: () =>
        set((state) => (state.daySet ? { daySet: dismissTopAnecdote(state.daySet) } : {})),
    }),
    {
      name: "mentis-anecdote",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ daySet: state.daySet }),
      version: 1,
      migrate: (persistedState) => {
        const { daySet } = persistedState as { daySet: StoredAnecdoteDaySet | null };
        return { daySet: daySet === null ? null : restoreDaySet(daySet) };
      },
      // A failed read draws a new set all the same: a fresh set beats a card that never shows.
      onRehydrateStorage: () => () => useAnecdoteStore.setState({ hasHydrated: true }),
    },
  ),
);
