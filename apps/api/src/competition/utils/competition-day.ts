import type { DayScore } from "../types/day-score";

const PARIS_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// A Competition Day is the Europe/Paris date, whatever the Player's own timezone.
export const competitionDay = (now: Date): string => PARIS_DATE.format(now);

export const daysBefore = (day: string, count: number): string => {
  const shifted = new Date(`${day}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() - count);
  return shifted.toISOString().slice(0, 10);
};

export const seasonBounds = (day: string): { season: string; from: string; to: string } => {
  const season = day.slice(0, 7);
  const lastDay = new Date(`${season}-01T00:00:00Z`);
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1);
  lastDay.setUTCDate(0);
  return { season, from: `${season}-01`, to: lastDay.toISOString().slice(0, 10) };
};

export const sharesSeason = (day: string, other: string): boolean =>
  seasonBounds(day).season === seasonBounds(other).season;

// A Competition Day keeps the best of the Attempts it holds — a Replay only ever lifts the day.
export const bestScorePerDay = (scores: DayScore[]): DayScore[] => {
  const best = new Map<string, number>();
  for (const { day, score } of scores) {
    best.set(day, Math.max(best.get(day) ?? 0, score));
  }
  return [...best]
    .map(([day, score]) => ({ day, score }))
    .sort((left, right) => left.day.localeCompare(right.day));
};

export const seasonTotal = (scores: DayScore[]): number =>
  bestScorePerDay(scores).reduce((total, { score }) => total + score, 0);
