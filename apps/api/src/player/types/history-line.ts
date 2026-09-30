import type { AppHistorySession } from "@mentis/contracts/app";

// Only the lines the page keeps read their Theme's current Category.
export type HistoryLine = Omit<AppHistorySession, "category">;
