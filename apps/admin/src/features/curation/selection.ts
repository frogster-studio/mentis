import type { AdminCategoryListResponse, AdminThemeListResponse } from "@mentis/contracts/admin";

export type Selection = {
  categoryId: string | null;
  themeId: string | null;
  questionId: string | null;
};

export const NO_SELECTION: Selection = { categoryId: null, themeId: null, questionId: null };

const PARAMS = { categoryId: "category", themeId: "theme", questionId: "question" } as const;

export function readSelection(params: URLSearchParams): Selection {
  return {
    categoryId: params.get(PARAMS.categoryId) || null,
    themeId: params.get(PARAMS.themeId) || null,
    questionId: params.get(PARAMS.questionId) || null,
  };
}

export function selectionQuery(selection: Selection): string {
  const params = new URLSearchParams();
  for (const [key, name] of Object.entries(PARAMS)) {
    const value = selection[key as keyof Selection];
    if (value) params.set(name, value);
  }
  const serialized = params.toString();
  return serialized === "" ? "" : `?${serialized}`;
}

export function selectCategory(categoryId: string): Selection {
  return { categoryId, themeId: null, questionId: null };
}

export function selectTheme(selection: Selection, themeId: string): Selection {
  return { ...selection, themeId, questionId: null };
}

export function selectQuestion(selection: Selection, questionId: string): Selection {
  return { ...selection, questionId };
}

// A deep link can name rows that no longer exist, so a selection is only kept while its parents are.
export function resolveSelection(
  selection: Selection,
  catalog: { categories?: AdminCategoryListResponse; themes?: AdminThemeListResponse },
): Selection {
  const { categories, themes } = catalog;
  if (selection.categoryId && categories?.every(({ id }) => id !== selection.categoryId)) {
    return NO_SELECTION;
  }
  const theme = selection.themeId ? themes?.find(({ id }) => id === selection.themeId) : undefined;
  if (selection.themeId && themes && theme?.categoryId !== selection.categoryId) {
    return { ...selection, themeId: null, questionId: null };
  }
  return selection;
}

// Visible is derived, never stored: a Category is what its Published Themes make it.
export function visibleCategoryIds(themes: AdminThemeListResponse): Set<string> {
  return new Set(themes.filter(({ published }) => published).map(({ categoryId }) => categoryId));
}
