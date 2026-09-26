// In-memory updates are synchronous, so home reflects a finished session at once.

import type { AppStreak } from "@mentis/contracts/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type DeviceStats, recordPracticeDay, recordSession } from "./stats";

type StatsStore = {
  stats: DeviceStats;
  // Paris dates, the signed-out Practice Streak's days.
  practiceDays: string[];
  // The Practice Streak displayed at the last sign-out, carried into the signed-out world.
  practiceStreakSeed: AppStreak | null;
  // The Theme name is captured here so home cards render without a catalog query.
  recordSession: (themeId: string, name: string, points: number, day: string) => void;
  setPracticeStreakSeed: (seed: AppStreak | null) => void;
  // The Stats Transfer's move: cleared so nothing is ever counted in both worlds.
  reset: () => void;
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      stats: {},
      practiceDays: [],
      practiceStreakSeed: null,
      recordSession: (themeId, name, points, day) =>
        set((state) => ({
          stats: recordSession(state.stats, themeId, name, points),
          practiceDays: recordPracticeDay(state.practiceDays, day),
        })),
      setPracticeStreakSeed: (practiceStreakSeed) => set({ practiceStreakSeed }),
      reset: () => set({ stats: {}, practiceDays: [] }),
    }),
    {
      name: "mentis-theme-stats",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
