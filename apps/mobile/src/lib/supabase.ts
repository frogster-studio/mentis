import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env",
  );
}

// The Account era needs a real session: sign-in must survive app restarts and the access
// token must refresh itself. Persisted through AsyncStorage (the same store the device stats
// already use) and auto-refreshed. `detectSessionInUrl` stays off — mobile hands ID tokens
// directly; the web OAuth redirect flow turns it on later.
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Auto-refresh must only tick while the app is in the foreground: Supabase drives it off
// AppState transitions. Native only — on web the token refreshes on its own timer and there
// is no AppState to hang this on (and it would run during the static export build).
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
