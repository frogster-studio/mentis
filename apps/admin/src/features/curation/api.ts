import {
  type AdminQuestionWrite,
  adminCategoryListResponseSchema,
  adminQuestionListResponseSchema,
  adminQuestionResponseSchema,
  adminThemeListResponseSchema,
} from "@mentis/contracts/admin";
import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteFromApi, getFromApi, sendToApi } from "@/lib/api/client";

const curationKeys = {
  categories: ["curation", "categories"] as const,
  themes: ["curation", "themes"] as const,
  allQuestions: ["curation", "questions"] as const,
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

type AuthoredQuestion = { id?: string; question: AdminQuestionWrite };

// A Question can move Theme, so every cached column is refetched rather than patched in place.
async function refetchCatalogColumns(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: curationKeys.allQuestions }),
    queryClient.invalidateQueries({ queryKey: curationKeys.themes }),
  ]);
}

export function useSaveQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, question }: AuthoredQuestion) =>
      id === undefined
        ? sendToApi("POST", "/questions", question, adminQuestionResponseSchema)
        : sendToApi("PATCH", `/questions/${id}`, question, adminQuestionResponseSchema),
    onSuccess: () => refetchCatalogColumns(queryClient),
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFromApi(`/questions/${id}`),
    onSuccess: () => refetchCatalogColumns(queryClient),
  });
}
