import { useAccountStats } from "@/features/account/api";
import { currentStreak, parisDay } from "@/features/account/streak";

// Signed out, the stats read stays off and the Streak is 0. Today is read at render, so a cached
// Streak never outlives its midnight.
export function useCompetitionStreak(owner: string | undefined): number {
  const streak = useAccountStats(owner).data?.competitionStreak;
  return currentStreak(streak ?? null, parisDay(new Date()));
}
