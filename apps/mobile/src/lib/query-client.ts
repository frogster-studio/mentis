import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { focusManager, type Query, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
// The pure core, not the composed `@/lib/api`: importing that here would drag its module-scope
// EXPO_PUBLIC_API_URL check into every consumer of the query client.
import { isApiError } from "@/lib/api/client";

const RETRIES = 3;

// Two API answers are worth no retry at all. A 429 means the limiter already counted this caller, so
// retrying spends the same bucket and pushes the reset further out. A 401 means the seam has just
// signed the Player out — the session is unrecoverable, and a retry would only fail again.
function retry(failureCount: number, error: unknown): boolean {
  if (isApiError(error, "RATE_LIMITED") || isApiError(error, "UNAUTHENTICATED")) {
    return false;
  }
  return failureCount < RETRIES;
}

export const queryClient = new QueryClient({ defaultOptions: { queries: { retry } } });

// Queries under this key root are the Account Stats pull: the only queries persisted offline (see
// persistOptions), built into keys by account/api. The theme list and question draws stay in memory.
export const ACCOUNT_QUERY_ROOT = "account";

// Account Stats are cached to AsyncStorage so a signed-in offline launch still renders the
// last-known shelf. Only ACCOUNT_QUERY_ROOT queries are dehydrated. maxAge is infinite: a Player's
// own stats never expire, the next online pull simply refreshes them.
export const persistOptions = {
  persister: createAsyncStoragePersister({ storage: AsyncStorage }),
  maxAge: Number.POSITIVE_INFINITY,
  // Any entry written under a different buster is discarded on hydration, so a cached shelf can
  // never outlive the shape it was written in. Bump it whenever the account key or payload changes.
  buster: "api-v1",
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
