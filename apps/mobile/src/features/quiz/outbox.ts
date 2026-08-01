// Outbox reducer (the write-path seam, per ADR 0003): the small persisted queue of finished
// signed-in Quiz Sessions waiting to be pushed to the `quiz_sessions` table. A pure transition
// table in the session-reducer style — the id, the finish timestamp and the owner all arrive
// through the action, so nothing is read from the clock, the network or auth here.
//
// Its core invariant: replaying any transition leaves the same queue, so a flaky push (a retry,
// an app restart, a double-drain) can never double-count a session. The client-generated UUID is
// the server's upsert key, and the queue itself holds each id at most once. "Retention on failure"
// needs no transition of its own — a push that does not land simply is not acked, so its rows stay.

import type { AccountSession } from "./account-stats";

// One finished Quiz Session queued for the server: exactly the `quiz_sessions` row, owner-tagged so
// a sign-out can retain it for that Account's next sign-in without it ever bleeding into another
// world. The Theme name is captured (like the Device store already does), so a catalog rotation
// can never orphan or rename the row.
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
  // A finished signed-in session: the whole row, with id / finishedAt / owner injected by the caller.
  | { type: "enqueue"; entry: OutboxEntry }
  // Push success: drop exactly the ids of the batch that landed. Order- and duplicate-insensitive.
  | { type: "ack"; ids: string[] }
  // A push rejected because the owner no longer exists: drop every row of that Account, silently.
  | { type: "discardOwner"; owner: string };

export function outboxReducer(state: Outbox, action: OutboxAction): Outbox {
  switch (action.type) {
    case "enqueue":
      // Keyed by id: a replayed finish (or any double enqueue of one session) is a no-op, so the
      // queue never holds a session twice — the first pillar of replay-idempotence.
      return state.some((entry) => entry.id === action.entry.id) ? state : [...state, action.entry];
    case "ack": {
      const acked = new Set(action.ids);
      return state.filter((entry) => !acked.has(entry.id));
    }
    case "discardOwner":
      return state.filter((entry) => entry.owner !== action.owner);
  }
}

// The batch a push drains — and the rows the fold overlays on the shelf: every queued row of the
// signed-in owner, and only that owner (another Account's retained rows wait for their own
// sign-in). Enqueue appends on each finish, so insertion order is already oldest-first.
export function entriesForOwner(state: Outbox, owner: string): OutboxEntry[] {
  return state.filter((entry) => entry.owner === owner);
}

// A queued entry as the fold's optimistic overlay sees it: the same AccountSession shape a synced
// row folds into, so a still-pending session sits on the home shelf exactly like a landed one.
export function toAccountSession(entry: OutboxEntry): AccountSession {
  return { themeId: entry.themeId, themeName: entry.themeName, points: entry.points };
}

// The home shelf's optimistic overlay: the owner's still-pending sessions in the fold's shape,
// minus any a pull has already landed (matched by the shared client UUID). Reconciling by id is
// what keeps a session in flight — briefly both pending and just-pulled — counted exactly once, so
// a Theme Average never inflates while a push settles.
export function overlaySessions(
  state: Outbox,
  owner: string,
  syncedIds: ReadonlySet<string>,
): AccountSession[] {
  return entriesForOwner(state, owner)
    .filter((entry) => !syncedIds.has(entry.id))
    .map(toAccountSession);
}
