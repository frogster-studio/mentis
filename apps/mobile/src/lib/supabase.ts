import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { AppState, Platform } from "react-native";

const config = Constants.expoConfig?.extra as {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

// The static web prerender runs in Node, where AsyncStorage's localStorage shim finds no window.
const isPrerender = typeof window === "undefined";

// A prerender has no signed-in Player to restore, so reads answer empty and writes go nowhere.
const prerenderStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

// detectSessionInUrl stays off — mobile hands ID tokens directly; web's redirect flow comes later.
export const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
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
