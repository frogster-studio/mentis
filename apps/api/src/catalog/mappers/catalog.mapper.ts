import {
  type AppQuestionDrawResponse,
  type AppThemeListResponse,
  appQuestionDrawResponseSchema,
  appThemeListResponseSchema,
} from "@mentis/contracts/app";
import type { DrawnQuestion, ThemeWithQuestionCount } from "../repositories/catalog.repository";
import { themeImageUrl } from "./theme-image-url";

export const toAppThemeListResponse = (
  themes: ThemeWithQuestionCount[],
  supabaseUrl: string,
): AppThemeListResponse =>
  appThemeListResponseSchema.parse(
    themes.map(({ image, ...theme }) => ({
      ...theme,
      imageUrl: themeImageUrl(supabaseUrl, image),
    })),
  );

export const toAppQuestionDrawResponse = (questions: DrawnQuestion[]): AppQuestionDrawResponse =>
  appQuestionDrawResponseSchema.parse(questions);
