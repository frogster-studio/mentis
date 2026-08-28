import {
  adminCategoryListResponseSchema,
  adminQuestionListResponseSchema,
  adminThemeListResponseSchema,
} from "@mentis/contracts/admin";
import { useQuery } from "@tanstack/react-query";

import { getFromApi } from "@/lib/api/client";

const curationKeys = {
  categories: ["curation", "categories"] as const,
  themes: ["curation", "themes"] as const,
  questions: (themeId: string) => ["curation", "questions", themeId] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: curationKeys.categories,
    queryFn: () => getFromApi("/categories", adminCategoryListResponseSchema),
  });
}

export function useThemes() {
  return useQuery({
    queryKey: curationKeys.themes,
    queryFn: () => getFromApi("/themes", adminThemeListResponseSchema),
  });
}

// Fetched on the Theme's first selection and kept, so walking back up a column never re-hits the wire.
export function useThemeQuestions(themeId: string | null) {
  return useQuery({
    queryKey: curationKeys.questions(themeId ?? ""),
    queryFn: () =>
      getFromApi("/questions", adminQuestionListResponseSchema, { themeId: themeId ?? "" }),
    enabled: themeId !== null,
  });
}
