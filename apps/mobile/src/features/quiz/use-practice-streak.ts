import type { AppStreak } from "@mentis/contracts/app";
import { useMemo } from "react";
import { useAccountStats } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { currentStreak, parisDay } from "@/features/account/streak";
import { useOutboxStore } from "./outbox-store";
import { practiceStreak } from "./practice-streak";
import { useStatsStore } from "./stats-store";

// All sources are read unconditionally (the hooks rule); auth state picks which world counts.
export function usePracticeStreakRecord(): AppStreak | null {
  const owner = useAuthStore((state) => state.session?.user.id);
  const accountStreak = useAccountStats(owner).data?.practiceStreak;
  const outbox = useOutboxStore((state) => state.entries);
  const seed = useStatsStore((state) => state.practiceStreakSeed);
  const deviceDays = useStatsStore((state) => state.practiceDays);

  return useMemo(
    () => practiceStreak(owner, { accountStreak, outbox, seed, deviceDays }),
    [owner, accountStreak, outbox, seed, deviceDays],
  );
}

// Today is read at render, so a cached Streak never outlives its midnight.
export function usePracticeStreak(): number {
  return currentStreak(usePracticeStreakRecord(), parisDay(new Date()));
}
