// The GDPR / App Store 5.1.1(v) erasure path: the server call runs first, while the token is live.

import { accountKeys } from "@/features/account/api";
import { useOutboxStore } from "@/features/quiz/outbox-store";
import { useTransferStore } from "@/features/quiz/transfer-store";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";

// Throws on failure — nothing local is touched unless the server delete succeeded first.
export async function deleteAccount(playerId: string): Promise<void> {
  await api.requestNoContent({ method: "DELETE", path: "/app/me/account" });

  // Both wipes are scoped by id, so another Account's retained state stays untouched.
  useOutboxStore.getState().discardOwner(playerId);
  queryClient.removeQueries({ queryKey: accountKeys.stats(playerId) });

  // Otherwise the signed-out home still claims the stats live on an Account that no longer exists.
  useTransferStore.getState().reset();

  // local scope skips the revoke round-trip (no user left) and still emits SIGNED_OUT.
  await supabase.auth.signOut({ scope: "local" });
}
