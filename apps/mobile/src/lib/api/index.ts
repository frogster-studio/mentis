import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";
import { type ApiClient, createApiClient } from "./client";

const config = Constants.expoConfig?.extra as { apiUrl: string };

export const api: ApiClient = createApiClient({
  baseUrl: config.apiUrl,
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
