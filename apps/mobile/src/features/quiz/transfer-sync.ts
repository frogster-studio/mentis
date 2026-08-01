// The accept side of the Stats Transfer — the thin, untested shell around Supabase and the stores
// (PRD: query wiring and Supabase calls are not unit-tested). It builds the baseline payload from
// the pure seam, inserts it insert-if-absent (so a retried accept never double-counts), then makes
// the move real: empties the device world, marks the transfer done, and pulls the new baselines onto
// the signed-in shelf. Every decision — what to move, the per-device idempotence — lives in the seam.

import { accountKeys } from "@/features/account/api";
import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";
import { useStatsStore } from "./stats-store";
import { buildTransferBaselines, type TransferBaseline } from "./stats-transfer";
import { useTransferStore } from "./transfer-store";

// The snake_case `stat_baselines` row (row mapping lives in the network shell, as in account/api).
// Owner is stamped here from the signed-in id; the pure seam never sees the Account.
function toBaselineRow(owner: string, baseline: TransferBaseline) {
  return {
    owner,
    device: baseline.device,
    theme_id: baseline.themeId,
    theme_name: baseline.themeName,
    total_points: baseline.totalPoints,
    session_count: baseline.sessionCount,
  };
}

// Move the device world into the Account. Insert-if-absent on the (owner, device, Theme) key means a
// retry — a double tap, a re-run after a flaky network — inserts nothing new, so the totals land
// exactly once. Only after the insert succeeds do we empty the device world and mark it transferred;
// a failure leaves the world untouched and throws, so the caller can keep the prompt up and retry.
export async function transferDeviceStats(owner: string): Promise<void> {
  const device = useTransferStore.getState().ensureDevice();
  const baselines = buildTransferBaselines(useStatsStore.getState().stats, device);
  if (baselines.length === 0) {
    return;
  }

  const { error } = await supabase.from("stat_baselines").upsert(
    baselines.map((baseline) => toBaselineRow(owner, baseline)),
    { onConflict: "owner,device,theme_id", ignoreDuplicates: true },
  );
  if (error) {
    throw new Error(error.message);
  }

  // The move is now durable server-side: empty the device world and record that a transfer happened
  // here (so the signed-out home explains where the stats went), then pull the new baselines so the
  // signed-in shelf shows them at once.
  useStatsStore.getState().reset();
  useTransferStore.getState().markTransferred();
  await queryClient.invalidateQueries({ queryKey: accountKeys.world(owner) });
}
