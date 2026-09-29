import type { AppStreak } from "@mentis/contracts/app";

const DAY_MS = 86_400_000;

const dayNumber = (day: string): number => Date.parse(`${day}T00:00:00Z`) / DAY_MS;

export const streakFromDays = (days: string[]): AppStreak => {
  let previous: string | undefined;
  let length = 0;
  let longest = 0;
  for (const day of [...new Set(days)].sort()) {
    length = previous !== undefined && dayNumber(day) - dayNumber(previous) === 1 ? length + 1 : 1;
    longest = Math.max(longest, length);
    previous = day;
  }
  return { lastDay: previous ?? null, length, longest };
};
