"use client";

import type { AdminThemeResponse } from "@mentis/contracts/admin";
import { type FormEvent, useEffect, useState } from "react";

import { useDeleteTheme, useSaveTheme } from "../api";
import { publishedLabel } from "../staging-labels";
import {
  blankThemeForm,
  isThemeFormDirty,
  type ThemeFormState,
  themeDeleteBlocker,
  themeDeleteConfirmation,
  themePayloadOf,
  toThemeForm,
} from "../theme-form";
import type { Category, Theme } from "../types";
import { Badge } from "./badge";
import { CONTROL } from "./control";
import { Field } from "./field";
import { TonalButton } from "./tonal-button";

interface ThemeFormProps {
  theme?: Theme;
  categories: Category[];
  selectedCategoryId: string | null;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: (theme: AdminThemeResponse) => void;
  onDeleted: () => void;
}

export const ThemeForm = ({
  theme,
  categories,
  selectedCategoryId,
  onDirtyChange,
  onSaved,
  onDeleted,
}: ThemeFormProps) => {
  const initialForm = () =>
    theme === undefined ? blankThemeForm(selectedCategoryId) : toThemeForm(theme);
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(initialForm);
  const save = useSaveTheme();
  const remove = useDeleteTheme();

  const isDirty = isThemeFormDirty(form, saved);
  const payload = themePayloadOf(form);
  const deleteBlocker = theme === undefined ? null : themeDeleteBlocker(theme.published);

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  const edit = (patch: Partial<ThemeFormState>) => setForm((current) => ({ ...current, ...patch }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (payload === null) {
      return;
    }
    save.mutate(
      { id: theme?.id, theme: payload },
      {
        onSuccess: (stored) => {
          setForm(toThemeForm(stored));
          setSaved(toThemeForm(stored));
          onSaved(stored);
        },
      },
    );
  };

  // The dashboard is the only guard there is, so the blocker is re-read here, not just rendered.
  const onDelete = () => {
    if (theme === undefined || deleteBlocker !== null) {
      return;
    }
    if (!window.confirm(themeDeleteConfirmation(theme.questionCount))) {
      return;
    }
    remove.mutate(theme.id, { onSuccess: onDeleted });
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

      <Field label="Category">
        <select
          value={form.categoryId}
          onChange={(event) => edit({ categoryId: event.target.value })}
          aria-label="Category"
          className={CONTROL}
        >
          <option value="">Select a Category</option>
          {[...categories]
            .sort((left, right) => left.name.localeCompare(right.name))
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
      </Field>

      <Field label="Image">
        <input
          type="text"
          value={form.image}
          onChange={(event) => edit({ image: event.target.value })}
          placeholder="les-simpson.webp"
          aria-label="Image"
          className={CONTROL}
        />
        <p className="mt-2 text-xs text-zinc-500">
          The path inside the theme-images bucket — uploading arrives with the image slice.
        </p>
      </Field>

      {theme ? (
        <>
          <Field label="Questions">
            {theme.readyQuestionCount} ready of {theme.questionCount}
          </Field>
          <Field label="Staging">
            <Badge isOn={theme.published}>{publishedLabel(theme.published)}</Badge>
          </Field>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="text-red-600 text-sm">
          {error.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <TonalButton type="submit" isDisabled={!isDirty || payload === null || isBusy}>
          {theme === undefined ? "Create Theme" : "Save changes"}
        </TonalButton>
        {theme ? (
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
      {theme && deleteBlocker ? <p className="text-xs text-zinc-500">{deleteBlocker}</p> : null}
    </form>
  );
};
