import type {
  AdminCategoryListResponse,
  AdminQuestionListResponse,
  AdminThemeListResponse,
} from "@mentis/contracts/admin";

export type Category = AdminCategoryListResponse[number];
export type Theme = AdminThemeListResponse[number];
export type Question = AdminQuestionListResponse[number];

export type Authoring = "category" | "question" | null;
