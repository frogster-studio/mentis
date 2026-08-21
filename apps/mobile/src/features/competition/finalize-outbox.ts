// Replaying any transition leaves the same queue, so a flaky push can never re-judge an Attempt.

import { ApiError } from "@/lib/api/client";
import type { PlayedAnswer } from "./attempt-reducer";

// Owner-tagged so a sign-out retains the batch without bleeding into another Account's world.
export type QueuedFinalize = {
  attemptId: string;
  owner: string;
  answers: PlayedAnswer[];
};

export type FinalizeOutbox = QueuedFinalize[];

export type FinalizeOutboxAction =
  | { type: "enqueue"; queued: QueuedFinalize }
  | { type: "ack"; attemptId: string }
  | { type: "discardOwner"; owner: string };

export function finalizeOutboxReducer(
  state: FinalizeOutbox,
  action: FinalizeOutboxAction,
): FinalizeOutbox {
  switch (action.type) {
    case "enqueue":
      // An Attempt is judged once, so the batch queued first is the one that counts.
      return state.some((queued) => queued.attemptId === action.queued.attemptId)
        ? state
        : [...state, action.queued];
    case "ack":
      return state.filter((queued) => queued.attemptId !== action.attemptId);
    case "discardOwner":
      return state.filter((queued) => queued.owner !== action.owner);
  }
}

export function queuedFinalize(
  state: FinalizeOutbox,
  attemptId: string,
): QueuedFinalize | undefined {
  return state.find((queued) => queued.attemptId === attemptId);
}

// Only the signed-in owner drains; another Account's retained batches wait for their own sign-in.
export function finalizesForOwner(state: FinalizeOutbox, owner: string): QueuedFinalize[] {
  return state.filter((queued) => queued.owner === owner);
}

// A batch refused on its merits will never land; only transient failures keep their place.
export function isPermanentRefusal(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.statusCode >= 400 &&
    error.statusCode < 500 &&
    error.code !== "RATE_LIMITED" &&
    error.code !== "UNAUTHENTICATED"
  );
}
