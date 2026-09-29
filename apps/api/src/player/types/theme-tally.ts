import type { AppAccountStatsResponse } from "@mentis/contracts/app";

// The database, not the tally, knows the Theme's current name and Category.
export type ThemeTally = Pick<
  AppAccountStatsResponse["themes"][number],
  "themeId" | "practice" | "competition"
>;
