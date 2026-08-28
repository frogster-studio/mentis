import {
  type AdminThemeResponse,
  type AdminThemeWrite,
  adminThemeWriteSchema,
} from "@mentis/contracts/admin";

export type ThemeFormState = {
  name: string;
  categoryId: string;
  image: string;
};

export function blankThemeForm(categoryId: string | null): ThemeFormState {
  return { name: "", categoryId: categoryId ?? "", image: "" };
}

export function toThemeForm(theme: AdminThemeResponse): ThemeFormState {
  return { name: theme.name, categoryId: theme.categoryId, image: theme.image };
}

// Null until the form is complete, so the same contract decides what the save button may send.
export function themePayloadOf(form: ThemeFormState): AdminThemeWrite | null {
  const parsed = adminThemeWriteSchema.safeParse(form);
  return parsed.success ? parsed.data : null;
}

export function isThemeFormDirty(form: ThemeFormState, saved: ThemeFormState): boolean {
  return (
    form.name !== saved.name || form.categoryId !== saved.categoryId || form.image !== saved.image
  );
}

// A Published Theme is being served, so it can only be deleted once it is unpublished.
export function themeDeleteBlocker(published: boolean): string | null {
  return published ? "Published — unpublish the Theme first." : null;
}

export function themeDeleteConfirmation(questionCount: number): string {
  const cascade =
    questionCount === 0
      ? "It holds no Question."
      : `Its ${questionCount} Question${questionCount === 1 ? "" : "s"} will be deleted with it.`;
  return `Delete this Theme for good? ${cascade}`;
}
