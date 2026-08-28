import {
  type AdminCategoryWrite,
  type AdminQuestionWrite,
  type AdminThemeWrite,
  adminCategoryListResponseSchema,
  adminCategoryResponseSchema,
  adminQuestionListResponseSchema,
  adminQuestionResponseSchema,
  adminThemeListResponseSchema,
  adminThemeResponseSchema,
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

type AuthoredCategory = { id?: string; category: AdminCategoryWrite };

export function useSaveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, category }: AuthoredCategory) =>
      id === undefined
        ? sendToApi("POST", "/categories", category, adminCategoryResponseSchema)
        : sendToApi("PATCH", `/categories/${id}`, category, adminCategoryResponseSchema),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: curationKeys.categories }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFromApi(`/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: curationKeys.categories }),
  });
}

export function useSaveTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, theme }: { id?: string; theme: AdminThemeWrite }) =>
      id === undefined
        ? sendToApi("POST", "/themes", theme, adminThemeResponseSchema)
        : sendToApi("PATCH", `/themes/${id}`, theme, adminThemeResponseSchema),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: curationKeys.themes }),
  });
}

export function useDeleteTheme() {
  const queryClient = useQueryClient();
  // The Theme's Questions die with it in the DB, so their cached column goes too.
  return useMutation({
    mutationFn: (id: string) => deleteFromApi(`/themes/${id}`),
    onSuccess: () => refetchCatalogColumns(queryClient),
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
