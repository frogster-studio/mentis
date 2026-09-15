import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { competitionKeys } from "@/features/competition/api";
import { worldKeys } from "@/features/world/api";
import { queryClient } from "@/lib/query-client";

export function useSeasonFreshness(owner: string | undefined) {
  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: worldKeys.leaderboard });
      if (owner !== undefined) {
        void queryClient.invalidateQueries({ queryKey: competitionKeys.standing(owner) });
        void queryClient.invalidateQueries({ queryKey: competitionKeys.day(owner) });
      }
    }, [owner]),
  );
}
