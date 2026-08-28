"use client";

import type { AdminThemeResponse } from "@mentis/contracts/admin";
import { type FormEvent, useEffect, useState } from "react";

import { useDeleteTheme, useSaveTheme, useStageTheme } from "../api";
import { publishBlocker, themeStagingConsequence } from "../staging";
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
import { Dialog } from "./dialog";
import { Field } from "./field";
import { ImageField } from "./image-field";
import { StagingSwitch } from "./staging-switch";
import { TonalButton } from "./tonal-button";

interface ThemeFormProps {
  theme?: Theme;
  categories: Category[];
  selectedCategoryId: string | null;
  isCategoryLastPublishedTheme: boolean;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: (theme: AdminThemeResponse) => void;
  onDeleted: () => void;
}

export const ThemeForm = ({
  theme,
  categories,
  selectedCategoryId,
  isCategoryLastPublishedTheme,
  onDirtyChange,
  onSaved,
  onDeleted,
}: ThemeFormProps) => {
  const initialForm = () =>
    theme === undefined ? blankThemeForm(selectedCategoryId) : toThemeForm(theme);
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(initialForm);
  const [isConsequenceShown, setIsConsequenceShown] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const save = useSaveTheme();
  const stage = useStageTheme();
  const remove = useDeleteTheme();

  const isDirty = isThemeFormDirty(form, saved);
  const payload = themePayloadOf(form);
  const deleteBlocker = theme === undefined ? null : themeDeleteBlocker(theme.published);
  // Unpublishing is never gated: only the way up asks the Theme to hold enough Ready Questions.
  const publishLock =
    theme === undefined || theme.published ? null : publishBlocker(theme.readyQuestionCount);

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

  // The dashboard is the only guard there is, so the lock is re-read here, not just rendered.
  const flipPublished = () => {
    if (theme === undefined || publishLock !== null) {
      return;
    }
    setIsConsequenceShown(false);
    stage.mutate({ id: theme.id, published: !theme.published });
  };

  const isBusy = save.isPending || stage.isPending || remove.isPending || isImageUploading;
  const error = save.error ?? stage.error ?? remove.error;

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
        <ImageField
          path={form.image}
          isUploading={isImageUploading}
          onUploadingChange={setIsImageUploading}
          onUploaded={(image) => edit({ image })}
        />
      </Field>

      {theme ? (
        <>
          <Field label="Questions">
            {theme.readyQuestionCount} ready of {theme.questionCount}
          </Field>
          <Field label="Staging">
            <div className="flex items-center gap-3">
              <StagingSwitch
                isOn={theme.published}
                label={publishedLabel(theme.published)}
                isDisabled={isBusy || publishLock !== null}
                onFlip={() => setIsConsequenceShown(true)}
              />
              <Badge isOn={theme.published}>{publishedLabel(theme.published)}</Badge>
            </div>
            {publishLock ? <p className="mt-2 text-xs text-zinc-500">{publishLock}</p> : null}
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

      {theme && isConsequenceShown ? (
        <ConsequenceDialog
          theme={theme}
          isCategoryLastPublishedTheme={isCategoryLastPublishedTheme}
          onDismiss={() => setIsConsequenceShown(false)}
          onConfirm={flipPublished}
        />
      ) : null}
    </form>
  );
};

interface ConsequenceDialogProps {
  theme: Theme;
  isCategoryLastPublishedTheme: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}

// The hard switch is never flipped blind: both directions state what players gain or lose.
const ConsequenceDialog = ({
  theme,
  isCategoryLastPublishedTheme,
  onDismiss,
  onConfirm,
}: ConsequenceDialogProps) => {
  const consequence = themeStagingConsequence(theme, isCategoryLastPublishedTheme);
  return (
    <Dialog
      title={consequence.title}
      onDismiss={onDismiss}
      confirm={{ label: consequence.confirmLabel, onConfirm }}
    >
      {consequence.lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </Dialog>
  );
};
