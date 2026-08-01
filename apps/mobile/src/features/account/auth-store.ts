// App-wide auth state, kept in sync with Supabase for the life of the process. `session` is the
// single source of truth for "signed in?" everywhere (the home profile icon, the « Compte »
// screen). `isLoading` stays true only until the persisted session is restored, so a signed-in
// Player never sees the signed-out world flash before the real state is known.

import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

type AuthStore = {
  session: Session | null;
  isLoading: boolean;
};

export const useAuthStore = create<AuthStore>(() => ({
  session: null,
  isLoading: true,
}));

// A single subscription for the whole app. Supabase emits `INITIAL_SESSION` right after this
// registers (with the restored session, or null when there is none) — that first event clears
// `isLoading` — then every later change: sign-in, sign-out, token refresh, the name-capture
// metadata write.
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.setState({ session, isLoading: false });
});
