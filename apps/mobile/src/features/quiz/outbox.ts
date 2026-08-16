// Replaying any transition leaves the same queue, so a flaky push can never double-count a session.

import type { AccountSession } from "./account-stats";

// Owner-tagged so a sign-out retains the rows for that Account without bleeding into another world.
export type OutboxEntry = {
  id: string; // client-generated UUID — the quiz_sessions primary key, and the push's upsert key
  owner: string; // the Account that finished the session (owner tagging)
  themeId: string;
  themeName: string;
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

// The fold's overlay shape: a still-pending session sits on the shelf exactly like a landed one.
export function toAccountSession(entry: OutboxEntry): AccountSession {
  return { themeId: entry.themeId, themeName: entry.themeName, points: entry.points };
}

// Matching by id keeps an in-flight session — briefly pending and pulled — counted exactly once.
export function overlaySessions(
  state: Outbox,
  owner: string,
  syncedIds: ReadonlySet<string>,
): AccountSession[] {
  return entriesForOwner(state, owner)
    .filter((entry) => !syncedIds.has(entry.id))
    .map(toAccountSession);
}
