import { type AdminCategoryWrite, adminCategoryWriteSchema } from "@mentis/contracts/admin";

import { isIconName } from "./icons";
import type { Category } from "./types";

const DEFAULT_COLOR = "#0ea5e9";

export type CategoryFormState = {
  name: string;
  color: string;
  icon: string;
};

export function blankCategoryForm(): CategoryFormState {
  return { name: "", color: DEFAULT_COLOR, icon: "" };
}

export function toCategoryForm(category: Category): CategoryFormState {
  return { name: category.name, color: category.color.toLowerCase(), icon: category.icon };
}

// A stored Category may predate the lowercase hex rule, and only the Editor may pick its replacement.
export function isServableColor(color: string): boolean {
  return adminCategoryWriteSchema.shape.color.safeParse(color).success;
}

// Null until the form is complete, so the same contract decides what the save button may send.
export function categoryPayloadOf(form: CategoryFormState): AdminCategoryWrite | null {
  if (!isIconName(form.icon)) {
    return null;
  }
  const parsed = adminCategoryWriteSchema.safeParse(form);
  return parsed.success ? parsed.data : null;
}

export function isCategoryFormDirty(form: CategoryFormState, saved: CategoryFormState): boolean {
  return form.name !== saved.name || form.color !== saved.color || form.icon !== saved.icon;
}

// The DB's RESTRICT is only the backstop: the dashboard is where an orphaning delete is stopped.
export function categoryDeleteBlocker(themeCount: number | null): string | null {
  if (themeCount === null) {
    return "Still counting this Category's Themes.";
  }
  if (themeCount === 0) {
    return null;
  }
  return `Holds ${themeCount} Theme${themeCount === 1 ? "" : "s"} — move or delete them first.`;
}
