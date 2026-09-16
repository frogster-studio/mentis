"use client";

import { type AdminThemeResponse, DEFAULT_THEME_IMAGE } from "@mentis/contracts/admin";
import { type FormEvent, useEffect, useRef, useState } from "react";

import {
  useDeleteTheme,
  useResetThemeImage,
  useSaveTheme,
  useStageTheme,
  useThemeImageConfig,
} from "../api";
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
import { pendingImageCleanup, storeImageCleanup } from "../theme-image-cleanup";
import { cleanupThemeImage } from "../theme-image-upload";
import type { Category, Theme } from "../types";
import { Badge } from "./badge";
import { CONTROL } from "./control";
import { Dialog } from "./dialog";
import { Field } from "./field";
import { ImageField } from "./image-field";
import { StagingSwitch } from "./staging-switch";
import { ThemeImageResetDialog } from "./theme-image-reset-dialog";
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
  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isResetShown, setIsResetShown] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cleanupTokens, setCleanupTokens] = useState<string[]>([]);
  const [isCleaning, setIsCleaning] = useState(false);
  const inFlight = useRef(false);
  const reset = useResetThemeImage();
  const imageConfig = useThemeImageConfig();
  const save = useSaveTheme();
  const stage = useStageTheme();
  const remove = useDeleteTheme();

  const isDirty = file !== null || isThemeFormDirty(form, saved);
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

  const rememberCleanup = (stored: AdminThemeResponse) => {
    const tokens = [
      ...new Set([
        ...pendingImageCleanup(stored.id),
        ...cleanupTokens,
        ...(stored.cleanupToken ? [stored.cleanupToken] : []),
      ]),
    ];
    setCleanupTokens(tokens);
    storeImageCleanup(stored.id, tokens);
  };

  useEffect(() => {
    if (theme?.id) setCleanupTokens(pendingImageCleanup(theme.id));
  }, [theme?.id]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (payload === null || inFlight.current || isBusy || !isDirty) return;
    inFlight.current = true;
    setFeedback(null);
    try {
      const stored = await save.mutateAsync({
        id: theme?.id,
        theme: { ...payload, expectedImage: saved.image },
        file: file ?? undefined,
      });
      setForm(toThemeForm(stored));
      setSaved(toThemeForm(stored));
      setFile(null);
      rememberCleanup(stored);
      setFeedback("Thème enregistré.");
      onSaved(stored);
    } catch {
      setFeedback(
        "Enregistrement impossible. Votre sélection est conservée. Vérifiez la connexion puis réessayez.",
      );
    } finally {
      inFlight.current = false;
    }
  };

  const resetImage = async () => {
    if (!theme || file || inFlight.current || isBusy) return;
    inFlight.current = true;
    setFeedback(null);
    try {
      const stored = await reset.mutateAsync({ id: theme.id, expectedImage: saved.image });
      setForm((current) => ({ ...current, image: stored.image }));
      setSaved((current) => ({ ...current, image: stored.image }));
      rememberCleanup(stored);
      setFeedback("L’image par défaut est maintenant associée au thème.");
      setIsResetShown(false);
    } catch {
      setIsResetShown(false);
    } finally {
      inFlight.current = false;
    }
  };

  const retryCleanup = async () => {
    if (!cleanupTokens.length || inFlight.current || isBusy) return;
    inFlight.current = true;
    setIsCleaning(true);
    try {
      const remaining: string[] = [];
      for (const token of cleanupTokens) {
        try {
          await cleanupThemeImage(token);
        } catch {
          remaining.push(token);
        }
      }
      setCleanupTokens(remaining);
      if (theme) storeImageCleanup(theme.id, remaining);
      setFeedback(
        remaining.length
          ? "Le nettoyage a échoué. L’image associée reste disponible."
          : "Anciennes images supprimées.",
      );
    } catch {
      setFeedback("Le nettoyage a échoué. L’image associée au thème reste disponible.");
    } finally {
      setIsCleaning(false);
      inFlight.current = false;
    }
  };

  // The dashboard is the only guard there is, so the blocker is re-read here, not just rendered.
  const onDelete = () => {
    if (theme === undefined || deleteBlocker !== null || isBusy || inFlight.current) {
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

  const isBusy =
    save.isPending ||
    stage.isPending ||
    remove.isPending ||
    reset.isPending ||
    isCleaning ||
    isValidating;
  const error = save.error ?? reset.error ?? stage.error ?? remove.error ?? imageConfig.error;

  return (
    <form onSubmit={onSubmit} aria-busy={isBusy} className="flex flex-col gap-5">
      <Field label="Name">
        <input
          type="text"
          value={form.name}
          onChange={(event) => edit({ name: event.target.value })}
          disabled={isBusy}
          aria-label="Name"
          className={CONTROL}
        />
      </Field>

      <Field label="Category">
        <select
          value={form.categoryId}
          onChange={(event) => edit({ categoryId: event.target.value })}
          disabled={isBusy}
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
          publicBaseUrl={imageConfig.data?.publicBaseUrl}
          file={file}
          isBusy={isBusy && !isValidating}
          onFileChange={setFile}
          onValidatingChange={setIsValidating}
          onReset={theme && imageConfig.data ? () => setIsResetShown(true) : undefined}
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

      {feedback ? (
        <p role="status" className="text-sm text-zinc-600">
          {feedback}
        </p>
      ) : null}
      {cleanupTokens.length ? (
        <div role="status" className="flex flex-col gap-2 text-sm text-zinc-600">
          <p>L’image est enregistrée. La suppression de l’ancienne image reste à terminer.</p>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void retryCleanup()}
            className="self-start text-sky-700 disabled:opacity-50"
          >
            {isCleaning ? "Nettoyage…" : "Réessayer le nettoyage"}
          </button>
        </div>
      ) : null}
      {isResetShown && imageConfig.data ? (
        <ThemeImageResetDialog
          defaultUrl={`${imageConfig.data.publicBaseUrl}${DEFAULT_THEME_IMAGE}`}
          isBusy={reset.isPending}
          onDismiss={() => setIsResetShown(false)}
          onConfirm={() => void resetImage()}
        />
      ) : null}
      <div className="flex items-center gap-3">
        <TonalButton type="submit" isDisabled={!isDirty || payload === null || isBusy}>
          {save.isPending ? "Enregistrement…" : theme === undefined ? "Create Theme" : "SAVE"}
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
