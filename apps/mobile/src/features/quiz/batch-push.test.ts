import { MAX_PUSH_BATCH } from "@mentis/contracts/app";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { isOwnerGoneError, pushInBatches } from "./batch-push";

function rows(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

function apiError(
  code: "ACCOUNT_GONE" | "RATE_LIMITED" | "INTERNAL",
  statusCode: number,
): ApiError {
  return new ApiError({ statusCode, error: "Error", message: "boom", code });
}

// Records what each run pushed and announced, so the ordering claims are checked, not assumed.
function recorder(failOnBatch?: { index: number; error: unknown }) {
  const pushed: number[][] = [];
  const landed: number[][] = [];
  const push = async (batch: number[]) => {
    if (failOnBatch && pushed.length === failOnBatch.index) {
      throw failOnBatch.error;
    }
    pushed.push(batch);
  };
  return { pushed, landed, push, onLanded: (batch: number[]) => landed.push(batch) };
}

describe("pushInBatches", () => {
  it("sends nothing at all for an empty queue", async () => {
    const { pushed, push, onLanded, landed } = recorder();

    await pushInBatches([], push, onLanded);

    expect(pushed).toEqual([]);
    expect(landed).toEqual([]);
  });

  it("caps each batch at the contract's maximum and keeps the queue's order", async () => {
    const { pushed, push } = recorder();

    await pushInBatches(rows(450), push);

    expect(pushed.map((batch) => batch.length)).toEqual([MAX_PUSH_BATCH, MAX_PUSH_BATCH, 50]);
    expect(pushed.flat()).toEqual(rows(450));
  });

  it("drains a queue larger than one batch completely", async () => {
    const { pushed, landed, push, onLanded } = recorder();

    await pushInBatches(rows(201), push, onLanded);

    expect(pushed).toHaveLength(2);
    expect(landed).toEqual(pushed);
  });

  it("stops at the first failed batch and never sends the ones behind it", async () => {
    const { pushed, landed, push, onLanded } = recorder({
      index: 1,
      error: apiError("INTERNAL", 500),
    });

    await expect(pushInBatches(rows(600), push, onLanded)).rejects.toBeInstanceOf(ApiError);

    // Batch 0 landed and stays landed; batches 1-2 were never announced.
    expect(pushed).toHaveLength(1);
    expect(landed).toHaveLength(1);
    expect(landed[0]).toEqual(rows(MAX_PUSH_BATCH));
  });

  it("rethrows the original error untouched, so the caller can tell gone from transient", async () => {
    const gone = apiError("ACCOUNT_GONE", 410);
    const { push } = recorder({ index: 0, error: gone });

    await expect(pushInBatches(rows(10), push)).rejects.toBe(gone);
  });

  it("announces a batch only after its push resolves", async () => {
    const order: string[] = [];

    await pushInBatches(
      rows(400),
      async () => {
        order.push("push");
      },
      () => order.push("landed"),
    );

    expect(order).toEqual(["push", "landed", "push", "landed"]);
  });
});

describe("isOwnerGoneError", () => {
  it("is true only for ACCOUNT_GONE — the outbox's single discard trigger", () => {
    expect(isOwnerGoneError(apiError("ACCOUNT_GONE", 410))).toBe(true);
  });

  it("is false for every other API failure, so those rows stay queued", () => {
    expect(isOwnerGoneError(apiError("RATE_LIMITED", 429))).toBe(false);
    expect(isOwnerGoneError(apiError("INTERNAL", 500))).toBe(false);
  });

  it("is false for a plain network error, the offline case", () => {
    expect(isOwnerGoneError(new TypeError("Network request failed"))).toBe(false);
  });
});
