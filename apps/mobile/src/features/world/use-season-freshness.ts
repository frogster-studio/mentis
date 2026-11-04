import type { QueryKey } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { msUntilParisMidnight } from "@/features/competition/catchup-deadline";
import { isCurrentDay, isCurrentSeason } from "@/features/competition/freshness";
import { competitionKeys } from "@/features/competition/keys";
import { worldKeys } from "@/features/world/keys";
import { queryClient } from "@/lib/query-client";

// A focus re-reads only what has gone stale or out of date, so a tab switch costs nothing on its own.
export function useSeasonFreshness(owner: string | undefined) {
  useFocusEffect(
    useCallback(() => {
      const rereadOutdated = () => {
        const now = new Date();
        refetchOutdated(worldKeys.leaderboard, isCurrentSeason, now);
        if (owner !== undefined) {
          refetchOutdated(competitionKeys.standing(owner), isCurrentSeason, now);
          refetchOutdated(competitionKeys.day(owner), isCurrentDay, now);
        }
      };
      rereadOutdated();
      const ownerKeys =
        owner === undefined ? [] : [competitionKeys.standing(owner), competitionKeys.day(owner)];
      // A transcript never goes stale once read, so this re-reads only one that has none.
      for (const queryKey of [worldKeys.leaderboard, competitionKeys.transcripts, ...ownerKeys]) {
        void queryClient.refetchQueries(
          { queryKey, stale: true, type: "active" },
          { cancelRefetch: false },
        );
      }
      // On screen, the Paris midnight outdates the Day, and the Standing and pages on the 1st.
      let midnight: ReturnType<typeof setTimeout>;
      const rereadAtMidnight = () => {
        midnight = setTimeout(() => {
          rereadOutdated();
          rereadAtMidnight();
        }, msUntilParisMidnight(new Date()));
      };
      rereadAtMidnight();
      return () => clearTimeout(midnight);
    }, [owner]),
  );
}

// An observer caches its staleness, so data the Paris calendar turned over is invalidated by its date.
function refetchOutdated<T>(
  queryKey: QueryKey,
  isCurrent: (data: T, now: Date) => boolean,
  now: Date,
) {
  for (const [key, data] of queryClient.getQueriesData<T>({ queryKey })) {
    if (data !== undefined && !isCurrent(data, now)) {
      void queryClient.invalidateQueries(
        { queryKey: key, exact: true, refetchType: "active" },
        { cancelRefetch: false },
      );
    }
  }
}
