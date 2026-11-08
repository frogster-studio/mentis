import { parisDay } from "@/features/account/streak";

const SEASON_LENGTH = "yyyy-mm".length;

export function isCurrentDay(read: { day: string }, now: Date): boolean {
  return read.day === parisDay(now);
}

// A Season is the Paris calendar month, so it turns over with the Paris midnight that opens the 1st.
export function isCurrentSeason(read: { season: string }, now: Date): boolean {
  return read.season === parisDay(now).slice(0, SEASON_LENGTH);
}
