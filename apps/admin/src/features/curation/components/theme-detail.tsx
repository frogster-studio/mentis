import { publishedLabel } from "../staging-labels";
import type { Category, Theme } from "../types";
import { Badge } from "./badge";
import { Field } from "./field";

interface ThemeDetailProps {
  theme: Theme;
  category?: Category;
}

export const ThemeDetail = ({ theme, category }: ThemeDetailProps) => {
  return (
    <>
      <Field label="Theme">{theme.name}</Field>
      <Field label="Category">{category?.name ?? "—"}</Field>
      <Field label="Image">
        <span className="break-all font-mono text-zinc-600 text-xs">{theme.image}</span>
      </Field>
      <Field label="Questions">
        {theme.readyQuestionCount} ready of {theme.questionCount}
      </Field>
      <Field label="Staging">
        <Badge isOn={theme.published}>{publishedLabel(theme.published)}</Badge>
      </Field>
    </>
  );
};
