import type { AppAccountStatsResponse } from "@mentis/contracts/app";
import { accountKeys } from "@/features/account/api";
import { accountPracticeStreak } from "@/features/account/streak";
import { queryClient } from "@/lib/query-client";
import { entriesForOwner, pendingPracticeDays } from "./outbox";
import { useOutboxStore } from "./outbox-store";
import { useStatsStore } from "./stats-store";

// Kept before the drain, while the unpushed sessions still overlay the Account's Streak.
export function keepPracticeStreakSeed(playerId: string): void {
  const stats = queryClient.getQueryData<AppAccountStatsResponse>(accountKeys.stats(playerId));
  const pending = entriesForOwner(useOutboxStore.getState().entries, playerId);
  const seed = accountPracticeStreak(stats?.practiceStreak, pendingPracticeDays(pending));
  useStatsStore.getState().setPracticeStreakSeed(seed);
}
