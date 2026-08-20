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
