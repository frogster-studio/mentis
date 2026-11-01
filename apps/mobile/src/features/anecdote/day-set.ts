import type { AppAnecdoteDrawResponse } from "@mentis/contracts/app";
import { parisDay } from "@/features/account/streak";
import { COLORS } from "@/theme/tokens";

export type Anecdote = AppAnecdoteDrawResponse[number];

export type AnecdoteDaySet = {
  day: string;
  anecdotes: Anecdote[];
  // Anecdotes are dismissed in order, so this count is also the top Anecdote's position.
  dismissedCount: number;
};

// Colours belong to the pile's positions, top first, never to the Anecdote they hold.
const PILE_COLORS = [COLORS.face, COLORS.trough, COLORS.troughDeep];

export function buildDaySet(anecdotes: Anecdote[], now: Date): AnecdoteDaySet {
  return { day: parisDay(now), anecdotes, dismissedCount: 0 };
}

// A past day's set is dropped even partly dismissed; today's, even empty or done, is kept.
export function isDrawDue(daySet: AnecdoteDaySet | null, now: Date): boolean {
  return daySet?.day !== parisDay(now);
}

export function topAnecdote(daySet: AnecdoteDaySet): Anecdote | null {
  return daySet.anecdotes[daySet.dismissedCount] ?? null;
}

export function dismissTopAnecdote(daySet: AnecdoteDaySet): AnecdoteDaySet {
  if (topAnecdote(daySet) === null) {
    return daySet;
  }
  return { ...daySet, dismissedCount: daySet.dismissedCount + 1 };
}

export function pileColors(remainingCount: number): string[] {
  return PILE_COLORS.slice(0, remainingCount);
}
