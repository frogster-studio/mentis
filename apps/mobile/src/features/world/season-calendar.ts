const PARIS_CALENDAR = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "numeric",
  hour: "numeric",
  hourCycle: "h23",
});
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function calendarParts(now: Date) {
  const parts = PARIS_CALENDAR.formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), hour: value("hour") };
}

export function sessionNumber(now: Date): number {
  const { year, month } = calendarParts(now);
  return Math.max(0, (year - 2026) * 12 + month - 8);
}

export function monthTimeLeft(now: Date) {
  const { year, month } = calendarParts(now);
  const nextMonthUtc = Date.UTC(year, month, 1);
  const parisOffset = calendarParts(new Date(nextMonthUtc)).hour * HOUR_MS;
  const remaining = Math.max(0, nextMonthUtc - parisOffset - now.getTime());
  return {
    days: Math.floor(remaining / DAY_MS),
    hours: Math.floor((remaining % DAY_MS) / HOUR_MS),
    minutes: Math.floor((remaining % HOUR_MS) / 60000),
  };
}
