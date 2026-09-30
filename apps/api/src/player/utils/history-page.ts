import type { AppHistorySession } from "@mentis/contracts/app";

type PlayedLine = Pick<AppHistorySession, "playedAt">;

const newestFirst = (a: PlayedLine, b: PlayedLine): number =>
  Date.parse(b.playedAt) - Date.parse(a.playedAt);

// Each read holds at most `size` lines, so only a short pair of reads proves the History ends here.
export const historyPage = <Line extends PlayedLine>(
  practice: Line[],
  competition: Line[],
  size: number,
): { sessions: Line[]; nextBefore: string | null } => {
  const sessions = [...practice, ...competition].sort(newestFirst).slice(0, size);
  const historyEnds = practice.length < size && competition.length < size;
  return { sessions, nextBefore: historyEnds ? null : (sessions.at(-1)?.playedAt ?? null) };
};
