import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { answerTopTile, type QuickHomeQuestionDaySet } from "./day-set";

type QuickHomeQuestionStore = {
  // No draw leaves before this, or a relaunch would re-request a day already stored.
  hasHydrated: boolean;
  daySet: QuickHomeQuestionDaySet | null;
  land: (daySet: QuickHomeQuestionDaySet) => void;
  // Recorded at the tap, so an app killed mid-animation resumes on the next tile.
  answer: (choice: string) => void;
};

export const useQuickHomeQuestionStore = create<QuickHomeQuestionStore>()(
  persist(
    (set) => ({
      hasHydrated: false,
      daySet: null,
      land: (daySet) => set({ daySet }),
      answer: (choice) =>
        set((state) => (state.daySet ? { daySet: answerTopTile(state.daySet, choice) } : {})),
    }),
    {
      name: "mentis-quick-home-question",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ daySet: state.daySet }),
      // A failed read draws a new set all the same: a reshuffle beats a card that never shows.
      onRehydrateStorage: () => () => useQuickHomeQuestionStore.setState({ hasHydrated: true }),
    },
  ),
);
