"use client";

import { type FormEvent, useEffect, useState } from "react";

import { useDeleteCategory, useSaveCategory } from "../api";
import {
  blankCategoryForm,
  type CategoryFormState,
  categoryDeleteBlocker,
  categoryPayloadOf,
  isCategoryFormDirty,
  isServableColor,
  toCategoryForm,
} from "../category-form";
import { visibleLabel } from "../staging-labels";
import type { Category } from "../types";
import { Badge } from "./badge";
import { CONTROL } from "./control";
import { Field } from "./field";
import { IconField } from "./icon-field";
import { TonalButton } from "./tonal-button";

interface CategoryFormProps {
  category?: Category;
  isVisible: boolean;
  themeCount: number | null;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: (category: Category) => void;
  onDeleted: () => void;
}

export const CategoryForm = ({
  category,
  isVisible,
  themeCount,
  onDirtyChange,
  onSaved,
  onDeleted,
}: CategoryFormProps) => {
  const initialForm = () =>
    category === undefined ? blankCategoryForm() : toCategoryForm(category);
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(initialForm);
  const save = useSaveCategory();
  const remove = useDeleteCategory();

  const isDirty = isCategoryFormDirty(form, saved);
  const payload = categoryPayloadOf(form);
  const deleteBlocker = categoryDeleteBlocker(themeCount);

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  const edit = (patch: Partial<CategoryFormState>) =>
    setForm((current) => ({ ...current, ...patch }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (payload === null) {
      return;
    }
    save.mutate(
      { id: category?.id, category: payload },
      {
        onSuccess: (stored) => {
          setForm(toCategoryForm(stored));
          setSaved(toCategoryForm(stored));
          onSaved(stored);
        },
      },
    );
  };

  const onDelete = () => {
    if (category === undefined || !window.confirm("Delete this Category for good?")) {
      return;
    }
    remove.mutate(category.id, { onSuccess: onDeleted });
  };

  const isBusy = save.isPending || remove.isPending;
  const error = save.error ?? remove.error;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Name">
        <input
          type="text"
          value={form.name}
          onChange={(event) => edit({ name: event.target.value })}
          aria-label="Name"
          className={CONTROL}
        />
      </Field>

      <Field label="Color">
        <span className="flex items-center gap-2">
          <input
            type="color"
            value={form.color}
            onChange={(event) => edit({ color: event.target.value.toLowerCase() })}
            aria-label="Color"
            className="size-9 shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-white"
          />
          <span className="font-mono text-xs text-zinc-600">{form.color}</span>
        </span>
        {isServableColor(form.color) ? null : (
          <p className="mt-2 text-xs text-zinc-500">
            The stored color is not a lowercase #rrggbb — pick one to save.
          </p>
        )}
      </Field>

      <Field label="Icon">
        <IconField value={form.icon} onChange={(icon) => edit({ icon })} />
      </Field>

      {category ? (
        <Field label="Staging">
          <Badge isOn={isVisible}>{visibleLabel(isVisible)}</Badge>
        </Field>
      ) : null}

      {error ? (
        <p role="alert" className="text-red-600 text-sm">
          {error.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <TonalButton type="submit" isDisabled={!isDirty || payload === null || isBusy}>
          {category === undefined ? "Create Category" : "Save changes"}
        </TonalButton>
        {category ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={isBusy || deleteBlocker !== null}
            className="text-sm text-zinc-500 transition-colors hover:text-red-600 disabled:text-zinc-300 disabled:hover:text-zinc-300"
          >
            Delete
          </button>
        ) : null}
      </div>
      {category && deleteBlocker ? <p className="text-xs text-zinc-500">{deleteBlocker}</p> : null}
    </form>
  );
};
