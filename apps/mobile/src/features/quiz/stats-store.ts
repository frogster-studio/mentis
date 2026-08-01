// Device-local stats: a zustand store persisted through AsyncStorage. In-memory updates
// are synchronous (home reflects a finished session at once); the persisted copy survives
// app restarts. All accumulation logic lives in the pure `stats` module (seam 4).

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type DeviceStats, recordSession } from "./stats";

type StatsStore = {
  stats: DeviceStats;
  // Called once when a Quiz Session finishes (never for Abandoned Sessions). The Theme
  // name is captured here so home cards render without a catalog query.
  recordSession: (themeId: string, name: string, points: number) => void;
  // Empties the device world — the Stats Transfer's move: once the pre-account totals land in the
  // Account as baselines, the device world is cleared so nothing is ever counted in both worlds.
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
      // Storage key renamed for the theme era: data under the old key is orphaned
      // harmlessly (free reset, pre-launch) rather than migrated.
      name: "mentis-theme-stats",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
