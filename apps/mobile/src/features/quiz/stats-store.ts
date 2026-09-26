// In-memory updates are synchronous, so home reflects a finished session at once.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type DeviceStats, recordPracticeDay, recordSession } from "./stats";

type StatsStore = {
  stats: DeviceStats;
  // Paris dates, the signed-out Practice Streak's days.
  practiceDays: string[];
  // The Theme name is captured here so home cards render without a catalog query.
  recordSession: (themeId: string, name: string, points: number, day: string) => void;
  // The Stats Transfer's move: cleared so nothing is ever counted in both worlds.
  reset: () => void;
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      stats: {},
      practiceDays: [],
      recordSession: (themeId, name, points, day) =>
        set((state) => ({
          stats: recordSession(state.stats, themeId, name, points),
          practiceDays: recordPracticeDay(state.practiceDays, day),
        })),
      reset: () => set({ stats: {}, practiceDays: [] }),
    }),
    {
      name: "mentis-theme-stats",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
