import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { competitionKeys } from "@/features/competition/api";
import { worldKeys } from "@/features/world/api";
import { queryClient } from "@/lib/query-client";

// A focus re-reads only what has gone stale, so a tab switch or a back costs nothing on its own.
export function useSeasonFreshness(owner: string | undefined) {
  useFocusEffect(
    useCallback(() => {
      const ownerKeys =
        owner === undefined ? [] : [competitionKeys.standing(owner), competitionKeys.day(owner)];
      for (const queryKey of [worldKeys.leaderboard, ...ownerKeys]) {
        void queryClient.refetchQueries(
          { queryKey, stale: true, type: "active" },
          { cancelRefetch: false },
        );
      }
    }, [owner]),
  );
}
