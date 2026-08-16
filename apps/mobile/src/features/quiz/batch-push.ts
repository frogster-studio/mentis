// What a failure means stays with the callers: the outbox retains, the transfer surfaces the error.

import { MAX_PUSH_BATCH } from "@mentis/contracts/app";
import { isApiError } from "@/lib/api/client";
import { chunk } from "@/utils/chunk";

// Only ACCOUNT_GONE may discard; every other failure is transient and the rows must stay queued.
export function isOwnerGoneError(error: unknown): boolean {
  return isApiError(error, "ACCOUNT_GONE");
}

// Rethrows the first failure untouched: landed batches keep their progress, the rest never send.
export async function pushInBatches<T>(
  items: readonly T[],
  push: (batch: T[]) => Promise<void>,
  onLanded: (batch: T[]) => void = () => {},
): Promise<void> {
  for (const batch of chunk(items, MAX_PUSH_BATCH)) {
    await push(batch);
    onLanded(batch);
  }
}
