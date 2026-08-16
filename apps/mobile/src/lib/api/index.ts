import { supabase } from "@/lib/supabase";
import { type ApiClient, createApiClient } from "./client";

// A missing API origin is a broken build, not a runtime branch — throw at load.
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("Missing EXPO_PUBLIC_API_URL in .env");
}

export const api: ApiClient = createApiClient({
  baseUrl: apiUrl,
  // Bound to globalThis: React Native's fetch throws when called detached from its receiver.
  fetch: (...args) => globalThis.fetch(...args),
  getToken: async () => {
    // getSession refreshes expired tokens itself, so a 401 means the session is unrecoverable.
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
  onUnauthenticated: () => {
    // Fire-and-forget: a failed sign-out must not mask the 401.
    void supabase.auth.signOut();
  },
});
