// Replaying any transition leaves the same queue, so a flaky push can never double-count a session.

import type { AppAccountStatsResponse, AppQuizSessionPushInput } from "@mentis/contracts/app";
import { mergeStreak, parisDay } from "@/features/account/streak";
import type { Category } from "@/types/quiz";
import type { ThemeTally } from "./theme-tallies";

// Owner-tagged so a sign-out retains the rows for that Account without bleeding into another world.
export type OutboxEntry = {
  id: string; // client-generated UUID — the quiz_sessions primary key, and the push's upsert key
  owner: string; // the Account that finished the session (owner tagging)
  themeId: string;
  themeName: string;
  category: Category; // captured at enqueue, so a first play joins its group before its push lands
  points: number;
  finishedAt: string; // ISO timestamp, injected at enqueue
};

export type Outbox = OutboxEntry[];

export type OutboxAction =
  // A finished signed-in session: the whole row, id/finishedAt/owner injected by the caller.
  | { type: "enqueue"; entry: OutboxEntry }
  // Push success: drop exactly the ids of the batch that landed. Order- and duplicate-insensitive.
  | { type: "ack"; ids: string[] }
  // A push rejected because the owner no longer exists: drop every row of that Account, silently.
  | { type: "discardOwner"; owner: string };

export function outboxReducer(state: Outbox, action: OutboxAction): Outbox {
  switch (action.type) {
    case "enqueue":
      // A replayed finish is a no-op, so the queue never holds a session twice.
      return state.some((entry) => entry.id === action.entry.id) ? state : [...state, action.entry];
    case "ack": {
      const acked = new Set(action.ids);
      return state.filter((entry) => !acked.has(entry.id));
    }
    case "discardOwner":
      return state.filter((entry) => entry.owner !== action.owner);
  }
}

// Only the signed-in owner drains; another Account's retained rows wait for their own sign-in.
export function entriesForOwner(state: Outbox, owner: string): OutboxEntry[] {
  return state.filter((entry) => entry.owner === owner);
}

// Neither the owner nor the Category goes on the wire: the API derives one and joins the other.
export function pushRow(entry: OutboxEntry): AppQuizSessionPushInput[number] {
  return {
    id: entry.id,
    themeId: entry.themeId,
    themeName: entry.themeName,
    points: entry.points,
    finishedAt: entry.finishedAt,
  };
}

// A pending session on a Theme the Account holds no row for creates it, with its captured Category.
export function withPracticeSessions(tallies: ThemeTally[], entries: OutboxEntry[]): ThemeTally[] {
  const byTheme = new Map(tallies.map((tally) => [tally.themeId, tally]));
  for (const entry of entries) {
    const tally = byTheme.get(entry.themeId) ?? {
      themeId: entry.themeId,
      themeName: entry.themeName,
      category: entry.category,
      practice: { sessionCount: 0, totalPoints: 0, bestScore: null },
      competition: { attemptCount: 0, judgedCount: 0, totalPoints: 0, bestScore: null },
    };
    byTheme.set(entry.themeId, {
      ...tally,
      practice: {
        sessionCount: tally.practice.sessionCount + 1,
        totalPoints: tally.practice.totalPoints + entry.points,
        bestScore: Math.max(tally.practice.bestScore ?? 0, entry.points),
      },
    });
  }
  return [...byTheme.values()];
}

// The phone overlays no Attempt: competition figures come from the server alone.
export function accountTallies(themes: ThemeTally[], state: Outbox, owner: string): ThemeTally[] {
  return withPracticeSessions(themes, entriesForOwner(state, owner));
}

// A session both pending and already pulled falls on a day the Account holds, so it counts once.
export function outboxPracticeDays(entries: OutboxEntry[]): string[] {
  return entries.map((entry) => parisDay(new Date(entry.finishedAt)));
}

// The Streak moves too, or a drained session would drop out of it until the next read.
export function withAckedSessions(
  previous: AppAccountStatsResponse,
  acked: OutboxEntry[],
): AppAccountStatsResponse {
  return {
    ...previous,
    themes: withPracticeSessions(previous.themes, acked),
    practiceStreak: mergeStreak(previous.practiceStreak, outboxPracticeDays(acked)),
  };
}
