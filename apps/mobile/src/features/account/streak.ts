import type { AppStreak } from "@mentis/contracts/app";

const PARIS_DATE = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const DAY_MS = 24 * 60 * 60 * 1000;

const dayNumber = (day: string): number => Date.parse(`${day}T00:00:00Z`) / DAY_MS;

const dayFromNumber = (number: number): string =>
  new Date(number * DAY_MS).toISOString().slice(0, 10);

export function parisDay(instant: Date): string {
  const parts = PARIS_DATE.formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function streakDays({ lastDay, length }: AppStreak): string[] {
  if (lastDay === null) {
    return [];
  }
  const last = dayNumber(lastDay);
  return Array.from({ length }, (_, offset) => dayFromNumber(last - offset));
}

// The Streak's run stands in for the days behind it; its longest survives even once the run breaks.
export function mergeStreak(streak: AppStreak | null, days: string[]): AppStreak {
  let previous: number | undefined;
  let length = 0;
  let longest = streak?.longest ?? 0;
  const merged = [...(streak ? streakDays(streak) : []), ...days];
  for (const day of [...new Set(merged)].sort()) {
    const current = dayNumber(day);
    length = previous !== undefined && current - previous === 1 ? length + 1 : 1;
    longest = Math.max(longest, length);
    previous = current;
  }
  return {
    lastDay: previous === undefined ? null : dayFromNumber(previous),
    length,
    longest,
  };
}

// Null until the Account stats load, so no Streak is ever shown or kept from nothing.
export function accountPracticeStreak(
  accountStreak: AppStreak | undefined,
  pendingDays: string[],
): AppStreak | null {
  return accountStreak === undefined ? null : mergeStreak(accountStreak, pendingDays);
}

// Yesterday still counts, since today can still be played. No Streak known yet shows 0.
export function currentStreak(streak: AppStreak | null, today: string): number {
  if (streak === null || streak.lastDay === null) {
    return 0;
  }
  return dayNumber(today) - dayNumber(streak.lastDay) <= 1 ? streak.length : 0;
}
