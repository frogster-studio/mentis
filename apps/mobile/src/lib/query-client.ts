import type { AppCompetitionDayResponse } from "@mentis/contracts/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { focusManager, type Query, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import { competitionKeys } from "@/features/competition/keys";
// The pure core, not @/lib/api: that would drag its module-scope env check into every consumer.
import { isApiError } from "@/lib/api/client";
import { shouldPersistQuery } from "@/lib/query-persistence";

const RETRIES = 3;

// Every read moves on a Player action the app already invalidates, so a mount or a focus trusts it this long.
export const STALE_TIME_MS = 5 * 60_000;
// The catalog and the pseudo change at an editor's or the Player's own pace, never behind the app's back.
export const LONG_STALE_TIME_MS = 60 * 60_000;

// A 429 retry spends the same limiter bucket; a 401 session is unrecoverable — retry neither.
function retry(failureCount: number, error: unknown): boolean {
  if (isApiError(error, "RATE_LIMITED") || isApiError(error, "UNAUTHENTICATED")) {
    return false;
  }
  return failureCount < RETRIES;
}

// Out-of-date data reads as none and is stale at once, so any mount or foreground re-reads it.
export function usableOnly<T>(isUsable: (data: T, now: Date) => boolean) {
  return {
    select: (data: T) => (isUsable(data, new Date()) ? data : undefined),
    staleTime: (query: Query<T>) =>
      query.state.data !== undefined && isUsable(query.state.data, new Date()) ? STALE_TIME_MS : 0,
  };
}

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry, staleTime: STALE_TIME_MS } },
});

// Cached to AsyncStorage so a launch, offline included, renders the last-known reads at once.
export const persistOptions = {
  persister: createAsyncStoragePersister({ storage: AsyncStorage }),
  maxAge: Number.POSITIVE_INFINITY,
  // Entries under another buster are dropped at hydration; bump it when the payload shape changes.
  buster: "api-v2",
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Query) => shouldPersistQuery(query, cachedDays, new Date()),
  },
  // A restored read has no observer until its screen mounts, and must outlive a session that never does.
  hydrateOptions: { defaultOptions: { queries: { gcTime: Number.POSITIVE_INFINITY } } },
};

function cachedDays(): AppCompetitionDayResponse[] {
  return queryClient
    .getQueriesData<AppCompetitionDayResponse>({ queryKey: competitionKeys.days })
    .flatMap(([, day]) => (day === undefined ? [] : [day]));
}

// Native has no browser focus event, so AppState drives the refetch-on-focus foreground pull.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (status) => {
    focusManager.setFocused(status === "active");
  });
}
