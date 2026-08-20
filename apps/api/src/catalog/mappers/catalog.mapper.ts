import {
  type AppQuestionDrawResponse,
  type AppThemeListResponse,
  appQuestionDrawResponseSchema,
  appThemeListResponseSchema,
} from "@mentis/contracts/app";
import type { DrawnQuestion, ThemeWithQuestionCount } from "../repositories/catalog.repository";

export const toAppThemeListResponse = (themes: ThemeWithQuestionCount[]): AppThemeListResponse =>
  appThemeListResponseSchema.parse(themes);

export const toAppQuestionDrawResponse = (questions: DrawnQuestion[]): AppQuestionDrawResponse =>
  appQuestionDrawResponseSchema.parse(questions);
