const PARIS_CALENDAR = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  hourCycle: "h23",
});
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

function calendarParts(now: Date) {
  const parts = PARIS_CALENDAR.formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour") };
}

// Yesterday's Competition closes for good at the Paris midnight.
export function msUntilParisMidnight(now: Date): number {
  const { year, month, day } = calendarParts(now);
  const nextDayUtc = Date.UTC(year, month - 1, day + 1);
  const parisOffset = calendarParts(new Date(nextDayUtc)).hour * HOUR_MS;
  return nextDayUtc - parisOffset - now.getTime();
}

// Rounded up, so the last seconds still read as a minute left.
export function catchupTimeLeft(now: Date) {
  const minutes = Math.ceil(msUntilParisMidnight(now) / MINUTE_MS);
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}
