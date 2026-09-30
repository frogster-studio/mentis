import type { AppHistorySession } from "@mentis/contracts/app";
import { HISTORY_TODAY, HISTORY_YESTERDAY } from "@/features/account/constants";

type HistorySection = { title: string; data: AppHistorySession[] };

const DAY_TITLE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const DAY_TITLE_WITH_YEAR = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function dayTitle(day: Date, today: Date): string {
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (isSameDay(day, today)) {
    return HISTORY_TODAY;
  }
  if (isSameDay(day, yesterday)) {
    return HISTORY_YESTERDAY;
  }
  return (day.getFullYear() === today.getFullYear() ? DAY_TITLE : DAY_TITLE_WITH_YEAR).format(day);
}

// Each day has one title, so the newest-first pages group by comparing it with the last section's.
export function historySections(sessions: AppHistorySession[], today: Date): HistorySection[] {
  const sections: HistorySection[] = [];
  for (const session of sessions) {
    const title = dayTitle(new Date(session.playedAt), today);
    const last = sections.at(-1);
    if (last?.title === title) {
      last.data.push(session);
    } else {
      sections.push({ title, data: [session] });
    }
  }
  return sections;
}
