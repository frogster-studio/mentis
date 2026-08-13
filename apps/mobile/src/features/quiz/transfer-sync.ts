// The accept side of the Stats Transfer — the thin shell around the API seam and the stores. It
// builds the baseline payload from the pure seam, pushes it insert-if-absent (so a retried accept
// never double-counts), then makes the move real: empties the device world, marks the transfer done,
// and pulls the new baselines onto the signed-in shelf. Every decision — what to move, the
// per-device idempotence — lives in the seam.

import { accountKeys } from "@/features/account/api";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { pushInBatches } from "./batch-push";
import { useStatsStore } from "./stats-store";
import { buildTransferBaselines } from "./stats-transfer";
import { useTransferStore } from "./transfer-store";

// Move the device world into the Account. Insert-if-absent on the (owner, device, Theme) key —
// enforced server-side — means a retry, a double tap, a re-run after a flaky network inserts nothing
// new, so the totals land exactly once. The device world is emptied only after **every** batch has
// landed: a failure part-way leaves the world untouched and throws, so the caller can keep the
// prompt up and retry the whole move, and the batches that did land simply no-op on the way back.
export async function transferDeviceStats(playerId: string): Promise<void> {
  const device = useTransferStore.getState().ensureDevice();
  const baselines = buildTransferBaselines(useStatsStore.getState().stats, device);
  if (baselines.length === 0) {
    return;
  }

  await pushInBatches(baselines, (batch) =>
    api.requestNoContent({ method: "POST", path: "/app/me/stat-baselines", body: batch }),
  );

  // The move is now durable server-side: empty the device world and record that a transfer happened
  // here (so the signed-out home explains where the stats went), then pull the new baselines so the
  // signed-in shelf shows them at once.
  useStatsStore.getState().reset();
  useTransferStore.getState().markTransferred();
  await queryClient.invalidateQueries({ queryKey: accountKeys.stats(playerId) });
}
