import {
  type AppAccountStatsResponse,
  type AppStreak,
  appAccountStatsResponseSchema,
} from "@mentis/contracts/app";
import type { ThemeEntity } from "../../_database/entities/theme.entity";
import type { ThemeTally } from "../types/theme-tally";

// A Theme the Editor deleted has no row left, so it reads its captured name and no Category.
const toThemeRow = (
  tally: ThemeTally,
  catalog: Map<string, ThemeEntity>,
  capturedNames: Map<string, string>,
) => {
  const theme = catalog.get(tally.themeId);
  return {
    ...tally,
    themeName: theme?.name ?? capturedNames.get(tally.themeId),
    category: theme?.category ?? null,
  };
};

export const toAppAccountStatsResponse = (
  themes: { tallies: ThemeTally[]; catalog: ThemeEntity[]; capturedNames: Map<string, string> },
  streaks: { practiceStreak: AppStreak; competitionStreak: AppStreak },
): AppAccountStatsResponse => {
  const catalog = new Map(themes.catalog.map((theme) => [theme.id, theme]));
  return appAccountStatsResponseSchema.parse({
    themes: themes.tallies.map((tally) => toThemeRow(tally, catalog, themes.capturedNames)),
    ...streaks,
  });
};
