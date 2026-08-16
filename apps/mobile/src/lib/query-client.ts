import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { focusManager, type Query, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
// The pure core, not @/lib/api: that would drag its module-scope env check into every consumer.
import { isApiError } from "@/lib/api/client";

const RETRIES = 3;

// A 429 retry spends the same limiter bucket; a 401 session is unrecoverable — retry neither.
function retry(failureCount: number, error: unknown): boolean {
  if (isApiError(error, "RATE_LIMITED") || isApiError(error, "UNAUTHENTICATED")) {
    return false;
  }
  return failureCount < RETRIES;
}

export const queryClient = new QueryClient({ defaultOptions: { queries: { retry } } });

// The one key root the offline persister dehydrates; everything else stays in memory.
export const ACCOUNT_QUERY_ROOT = "account";

// Cached to AsyncStorage so a signed-in offline launch still renders the last-known shelf.
export const persistOptions = {
  persister: createAsyncStoragePersister({ storage: AsyncStorage }),
  maxAge: Number.POSITIVE_INFINITY,
  // Entries under another buster are dropped at hydration; bump it when the payload shape changes.
  buster: "api-v1",
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Query) =>
      query.state.status === "success" && query.queryKey[0] === ACCOUNT_QUERY_ROOT,
  },
};

// Native has no browser focus event, so AppState drives the refetch-on-focus foreground pull.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (status) => {
    focusManager.setFocused(status === "active");
  });
}
