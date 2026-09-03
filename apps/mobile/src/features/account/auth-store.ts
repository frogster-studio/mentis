// isLoading holds until the persisted session restores, so the signed-out world never flashes.

import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { syncPurchasesIdentity } from "@/lib/purchases";
import { supabase } from "@/lib/supabase";

type AuthStore = {
  session: Session | null;
  isLoading: boolean;
};

export const useAuthStore = create<AuthStore>(() => ({
  session: null,
  isLoading: true,
}));

// Supabase emits INITIAL_SESSION right after this registers — that first event clears isLoading.
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.setState({ session, isLoading: false });
  syncPurchasesIdentity(session?.user.id ?? null);
});
