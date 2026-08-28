import { visibleLabel } from "../staging-labels";
import type { Category } from "../types";
import { Badge } from "./badge";
import { Field } from "./field";

interface CategoryDetailProps {
  category: Category;
  isVisible: boolean;
}

export const CategoryDetail = ({ category, isVisible }: CategoryDetailProps) => {
  return (
    <>
      <Field label="Category">{category.name}</Field>
      <Field label="Color">
        <span className="flex items-center gap-2">
          <span
            className="size-4 rounded-full border border-zinc-200"
            style={{ backgroundColor: category.color }}
          />
          <span className="font-mono text-zinc-600 text-xs">{category.color}</span>
        </span>
      </Field>
      <Field label="Icon">
        <span className="font-mono text-zinc-600 text-xs">{category.icon}</span>
      </Field>
      <Field label="Staging">
        <Badge isOn={isVisible}>{visibleLabel(isVisible)}</Badge>
      </Field>
    </>
  );
};
