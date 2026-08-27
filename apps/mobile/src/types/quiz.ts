// Wire shapes come from @mentis/contracts so drift has one home; device-only shapes stay local.

import type {
  AppCompetitionAttemptResponse,
  AppQuestionDrawResponse,
  AppThemeListResponse,
} from "@mentis/contracts/app";

export type ThemeWithCount = AppThemeListResponse[number];

export type Category = ThemeWithCount["category"];

export type Question = AppQuestionDrawResponse[number];

// Issuance withholds every answer form, so this shape is all the phone ever holds in competition.
export type CompetitionQuestion = AppCompetitionAttemptResponse["questions"][number];
