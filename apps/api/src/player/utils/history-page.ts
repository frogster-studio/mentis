import type { AppHistorySession } from "@mentis/contracts/app";

type PlayedLine = Pick<AppHistorySession, "playedAt">;

const newestFirst = (a: PlayedLine, b: PlayedLine): number =>
  Date.parse(b.playedAt) - Date.parse(a.playedAt);

// Only a short pair of reads that the cut left whole proves the History ends here.
export const historyPage = <Line extends PlayedLine>(
  practice: Line[],
  competition: Line[],
  size: number,
): { sessions: Line[]; nextBefore: string | null } => {
  const merged = [...practice, ...competition].sort(newestFirst);
  const sessions = merged.slice(0, size);
  const historyEnds = practice.length < size && competition.length < size && merged.length <= size;
  return { sessions, nextBefore: historyEnds ? null : (sessions.at(-1)?.playedAt ?? null) };
};
