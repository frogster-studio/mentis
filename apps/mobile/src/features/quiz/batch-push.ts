// The shared shape of both push paths (queued Quiz Sessions, transferred Stat Baselines): send the
// rows in capped batches, in order, stopping at the first batch that does not land. Pure and
// injectable — the push itself is a parameter — so the sequencing that both callers depend on is
// provable without a network or a store.
//
// The two callers differ only in what they do with a failure, which is why that decision stays with
// them: the outbox retains (or discards, on a gone Account), the transfer surfaces the error.

import { MAX_PUSH_BATCH } from "@mentis/contracts/app";
import { isApiError } from "@/lib/api/client";
import { chunk } from "@/utils/chunk";

// The only discard trigger there is: the API answers 410 when a push names an owner no longer in
// auth.users — the Account was deleted (its rows cascaded) while this device still held queued rows.
// Every other failure is transient, so those rows stay queued rather than being lost. Keying this on
// anything looser would make the outbox loop forever.
export function isOwnerGoneError(error: unknown): boolean {
  return isApiError(error, "ACCOUNT_GONE");
}

// Push every batch in order, announcing each one that lands. Rethrows the first failure untouched,
// so nothing after it is pushed and the caller sees the real error: the batches already announced
// keep their progress, and the rest are simply never sent.
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
