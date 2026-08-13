// Composition for the seam: the one place the pure client meets the real world — React Native's
// global fetch, the Supabase session as a token source, and a global sign-out on a dead session.
// Everything else imports `api` from here and never sees a dependency.

import { supabase } from "@/lib/supabase";
import { type ApiClient, createApiClient } from "./client";

// Read at module scope with a throw-at-load, matching the supabase.ts precedent: a missing API
// origin is a broken build, not a runtime branch — and no env framework for one variable.
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("Missing EXPO_PUBLIC_API_URL in .env");
}

export const api: ApiClient = createApiClient({
  baseUrl: apiUrl,
  // Bound to globalThis: React Native's fetch throws when called detached from its receiver.
  fetch: (...args) => globalThis.fetch(...args),
  getToken: async () => {
    // getSession refreshes an expired token on its own before handing it back, so the seam never
    // retries: by the time a 401 reaches us, the session is genuinely unrecoverable.
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
  onUnauthenticated: () => {
    // Fire-and-forget: the single onAuthStateChange listener (auth-store) flips the app to the
    // signed-out world. Nothing here waits on it, and a failed sign-out must not mask the 401.
    void supabase.auth.signOut();
  },
});
