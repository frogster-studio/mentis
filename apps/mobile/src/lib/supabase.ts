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

// The static web prerender runs in Node, where AsyncStorage's localStorage shim finds no window.
const isPrerender = typeof window === "undefined";

// A prerender has no signed-in Player to restore, so reads answer empty and writes go nowhere.
const prerenderStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

// detectSessionInUrl stays off — mobile hands ID tokens directly; web's redirect flow comes later.
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: isPrerender ? prerenderStorage : AsyncStorage,
    persistSession: !isPrerender,
    autoRefreshToken: !isPrerender,
    detectSessionInUrl: false,
  },
});

// Auto-refresh ticks only while foregrounded; web refreshes on its own timer, with no AppState.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
