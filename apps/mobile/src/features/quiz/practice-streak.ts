import type { AppStreak } from "@mentis/contracts/app";
import { accountPracticeStreak, mergeStreak } from "@/features/account/streak";
import { entriesForOwner, type Outbox, outboxPracticeDays } from "./outbox";

type PracticeStreakSources = {
  // Undefined until the Account stats load.
  accountStreak: AppStreak | undefined;
  outbox: Outbox;
  seed: AppStreak | null;
  deviceDays: string[];
};

// Signed in, the Account's Streak overlaid with the owner's unpushed sessions; signed out, the
// sign-out seed overlaid with the device's days.
export function practiceStreak(
  owner: string | undefined,
  { accountStreak, outbox, seed, deviceDays }: PracticeStreakSources,
): AppStreak | null {
  if (owner === undefined) {
    return mergeStreak(seed, deviceDays);
  }
  return accountPracticeStreak(accountStreak, outboxPracticeDays(entriesForOwner(outbox, owner)));
}
