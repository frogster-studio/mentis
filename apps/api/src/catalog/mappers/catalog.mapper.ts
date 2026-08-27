import {
  type AppQuestionDrawResponse,
  type AppThemeListResponse,
  appQuestionDrawResponseSchema,
  appThemeListResponseSchema,
} from "@mentis/contracts/app";
import type { DrawnQuestion } from "../repositories/catalog.repository";
import type { ThemeWithQuestionCount } from "../types/theme-with-question-count";

export const toAppThemeListResponse = (themes: ThemeWithQuestionCount[]): AppThemeListResponse =>
  appThemeListResponseSchema.parse(themes);

export const toAppQuestionDrawResponse = (questions: DrawnQuestion[]): AppQuestionDrawResponse =>
  appQuestionDrawResponseSchema.parse(questions);
