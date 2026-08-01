// The account-deletion shell (App Store guideline 5.1.1(v); also the GDPR erasure path): calls the
// security-definer `delete_account` RPC — which deletes the calling auth user, cascading away both
// player tables server-side — then wipes every local trace of that Account and drops the session.
// Deliberately untested, like the other Supabase/store shells (PRD: query wiring and Supabase calls
// are integration, not pure logic). Order matters: the RPC runs first, while the token is still live;
// only once the server has erased the Account do we clear local state and sign out.

import { accountKeys } from "@/features/account/api";
import { useOutboxStore } from "@/features/quiz/outbox-store";
import { useTransferStore } from "@/features/quiz/transfer-store";
import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";

// Erase the signed-in Account. Throws on a failed RPC so the caller can keep the confirmation up and
// surface the error — nothing local is touched unless the server delete succeeded first.
export async function deleteAccount(owner: string): Promise<void> {
  const { error } = await supabase.rpc("delete_account");
  if (error) {
    throw new Error(error.message);
  }

  // The Account is gone server-side (both player tables cascaded with it). Wipe its local footprint
  // so nothing outlives the sign-out: this owner's queued sessions — which could never push now, the
  // owner is gone — and its cached Account Stats shelf (keyed by this owner). Both are owner-scoped,
  // so another Account's retained state on this device is left untouched.
  useOutboxStore.getState().discardOwner(owner);
  queryClient.removeQueries({ queryKey: accountKeys.world(owner) });

  // Forget the transfer flags too: if this device had transferred its stats onto the now-deleted
  // Account, the signed-out home would otherwise still claim they live on a compte — one that no
  // longer exists. Reset clears that (and any dormancy), so the plain device world renders again.
  useTransferStore.getState().reset();

  // Drop the now-orphaned local session. `local` scope skips the server round-trip (there is no user
  // left to revoke a token for) and still emits SIGNED_OUT, so the app flips to the device world at
  // once — signed out and functional on whatever world remains.
  await supabase.auth.signOut({ scope: "local" });
}
