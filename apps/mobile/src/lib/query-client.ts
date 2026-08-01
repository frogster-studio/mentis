import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { focusManager, type Query, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";

export const queryClient = new QueryClient();

// Queries under this key root are the Account Stats pull: the only queries persisted offline (see
// persistOptions), built into keys by account/api. The theme list and question draws stay in memory.
export const ACCOUNT_QUERY_ROOT = "account";

// Account Stats are cached to AsyncStorage so a signed-in offline launch still renders the
// last-known shelf. Only ACCOUNT_QUERY_ROOT queries are dehydrated. maxAge is infinite: a Player's
// own stats never expire, the next online pull simply refreshes them.
export const persistOptions = {
  persister: createAsyncStoragePersister({ storage: AsyncStorage }),
  maxAge: Number.POSITIVE_INFINITY,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Query) =>
      query.state.status === "success" && query.queryKey[0] === ACCOUNT_QUERY_ROOT,
  },
};

// React Query refetches stale queries on window focus. Native has no browser focus event, so drive
// it off AppState: a foreground transition pulls fresh Account Stats (PRD sync rhythm — pull at
// sign-in, launch and foreground). Web keeps React Query's built-in visibility focus. Mirrors the
// module-scope AppState listener the Supabase client already uses for token auto-refresh.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (status) => {
    focusManager.setFocused(status === "active");
  });
}
