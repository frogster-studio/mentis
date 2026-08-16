// In-memory updates are synchronous, so home reflects a finished session at once.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type DeviceStats, recordSession } from "./stats";

type StatsStore = {
  stats: DeviceStats;
  // The Theme name is captured here so home cards render without a catalog query.
  recordSession: (themeId: string, name: string, points: number) => void;
  // The Stats Transfer's move: cleared so nothing is ever counted in both worlds.
  reset: () => void;
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      stats: {},
      recordSession: (themeId, name, points) =>
        set((state) => ({ stats: recordSession(state.stats, themeId, name, points) })),
      reset: () => set({ stats: {} }),
    }),
    {
      name: "mentis-theme-stats",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
