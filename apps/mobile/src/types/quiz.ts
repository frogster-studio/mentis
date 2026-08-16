// Wire shapes come from @mentis/contracts so drift has one home; device-only shapes stay local.

import type { AppQuestionDrawResponse, AppThemeListResponse } from "@mentis/contracts/app";

export type QuizMode = "cash" | "square";

export type ThemeWithCount = AppThemeListResponse[number];

export type Question = AppQuestionDrawResponse[number];
