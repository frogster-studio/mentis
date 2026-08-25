import { QuizAnswerModeEnum } from "@mentis/contracts/enums";
import type { ErrorResponse } from "@mentis/contracts/shared";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { PlayedAnswer } from "./attempt-reducer";
import {
  type FinalizeOutbox,
  finalizeOutboxReducer,
  finalizesForOwner,
  isPermanentRefusal,
  type QueuedFinalize,
  queuedFinalize,
} from "./finalize-outbox";

const OWNER = "owner-a";
const OTHER = "owner-b";

function answers(count: number): PlayedAnswer[] {
  return Array.from({ length: count }, (_, index) => ({
    questionId: `q${index + 1}`,
    mode: QuizAnswerModeEnum.CASH,
    rawInput: `réponse ${index + 1}`,
    clientElapsedMs: 1_000,
  }));
}

function queued(overrides: Partial<QueuedFinalize> = {}): QueuedFinalize {
  return { attemptId: "attempt-1", owner: OWNER, answers: answers(10), ...overrides };
}

function mixedOwners(): FinalizeOutbox {
  return [
    queued({ attemptId: "a1", owner: OWNER }),
    queued({ attemptId: "a2", owner: OTHER }),
    queued({ attemptId: "a3", owner: OWNER }),
  ];
}

function apiError(code: ErrorResponse["code"], statusCode: number): ApiError {
  return new ApiError({ statusCode, error: "Error", message: "boom", code });
}

describe("enqueue", () => {
  it("queues the batch owner-tagged, answers intact", () => {
    const batch = queued();
    expect(finalizeOutboxReducer([], { type: "enqueue", queued: batch })).toStrictEqual([batch]);
  });

  it("keeps the first batch for an Attempt — a replayed finish never re-judges it", () => {
    const first = queued({ answers: answers(10) });
    const state = finalizeOutboxReducer([], { type: "enqueue", queued: first });
    const second = queued({ answers: answers(4) });

    expect(finalizeOutboxReducer(state, { type: "enqueue", queued: second })).toBe(state);
  });

  it("holds a quit's served prefix as the whole batch", () => {
    const quit = queued({ answers: answers(4) });
    const state = finalizeOutboxReducer([], { type: "enqueue", queued: quit });

    expect(state[0].answers).toHaveLength(4);
  });
});

describe("ack", () => {
  it("drops exactly the Attempt that landed", () => {
    const state = finalizeOutboxReducer(mixedOwners(), { type: "ack", attemptId: "a2" });
    expect(state.map((batch) => batch.attemptId)).toStrictEqual(["a1", "a3"]);
  });

  it("is a no-op for an Attempt the queue never held", () => {
    expect(
      finalizeOutboxReducer(mixedOwners(), { type: "ack", attemptId: "unknown" }),
    ).toStrictEqual(mixedOwners());
  });
});

describe("discardOwner", () => {
  it("drops every batch of that Account and leaves the others queued", () => {
    const state = finalizeOutboxReducer(mixedOwners(), { type: "discardOwner", owner: OWNER });
    expect(state.map((batch) => batch.attemptId)).toStrictEqual(["a2"]);
  });
});

describe("reading the queue", () => {
  it("finds the batch still owed for an Attempt", () => {
    expect(queuedFinalize(mixedOwners(), "a3")?.owner).toBe(OWNER);
    expect(queuedFinalize(mixedOwners(), "a9")).toBeUndefined();
  });

  it("drains only the signed-in owner's batches", () => {
    expect(finalizesForOwner(mixedOwners(), OWNER).map((batch) => batch.attemptId)).toStrictEqual([
      "a1",
      "a3",
    ]);
  });
});

describe("isPermanentRefusal", () => {
  it("gives up on a batch the server judges unacceptable", () => {
    expect(isPermanentRefusal(apiError("ATTEMPT_EXPIRED", 409))).toBe(true);
    expect(isPermanentRefusal(apiError("ANSWER_NOT_SERVED", 400))).toBe(true);
    expect(isPermanentRefusal(apiError("NOT_FOUND", 404))).toBe(true);
    expect(isPermanentRefusal(apiError("ACCOUNT_GONE", 404))).toBe(true);
  });

  it("keeps a batch queued through anything that may yet land", () => {
    expect(isPermanentRefusal(apiError("RATE_LIMITED", 429))).toBe(false);
    expect(isPermanentRefusal(apiError("UNAUTHENTICATED", 401))).toBe(false);
    expect(isPermanentRefusal(apiError("INTERNAL", 500))).toBe(false);
    expect(isPermanentRefusal(new TypeError("Network request failed"))).toBe(false);
  });
});
