// The account-deletion shell (App Store guideline 5.1.1(v); also the GDPR erasure path): asks the
// API to delete the calling Player — which deletes the auth user, cascading away both player tables
// server-side — then wipes every local trace of that Account and drops the session. Order matters:
// the call runs first, while the token is still live; only once the server has erased the Account do
// we clear local state and sign out.

import { accountKeys } from "@/features/account/api";
import { useOutboxStore } from "@/features/quiz/outbox-store";
import { useTransferStore } from "@/features/quiz/transfer-store";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";

// Erase the signed-in Account. Throws on a failed call so the caller can keep the confirmation up
// and surface the error — nothing local is touched unless the server delete succeeded first.
export async function deleteAccount(playerId: string): Promise<void> {
  await api.requestNoContent({ method: "DELETE", path: "/app/me/account" });

  // The Account is gone server-side (both player tables cascaded with it). Wipe its local footprint
  // so nothing outlives the sign-out: this Player's queued sessions — which could never push now,
  // the owner is gone — and the cached Account Stats shelf (keyed by this Player). Both are scoped
  // by id, so another Account's retained state on this device is left untouched.
  useOutboxStore.getState().discardOwner(playerId);
  queryClient.removeQueries({ queryKey: accountKeys.stats(playerId) });

  // Forget the transfer flags too: if this device had transferred its stats onto the now-deleted
  // Account, the signed-out home would otherwise still claim they live on a compte — one that no
  // longer exists. Reset clears that (and any dormancy), so the plain device world renders again.
  useTransferStore.getState().reset();

  // Drop the now-orphaned local session. `local` scope skips the server round-trip (there is no user
  // left to revoke a token for) and still emits SIGNED_OUT, so the app flips to the device world at
  // once — signed out and functional on whatever world remains.
  await supabase.auth.signOut({ scope: "local" });
}
