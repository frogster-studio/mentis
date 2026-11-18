"use client";

import {
  type AdminAnecdoteResponse,
  ANECDOTE_MAX_LENGTH,
  adminAnecdoteWriteSchema,
} from "@mentis/contracts/admin";
import { type FormEvent, useEffect, useState } from "react";

import { useSaveAnecdote, useSaveAnecdoteImage } from "../api";
import type { Anecdote } from "../types";
import { AnecdoteText } from "./anecdote-text";
import { CONTROL } from "./control";
import { Field } from "./field";
import { ImageDropZone } from "./image-drop-zone";
import { TonalButton } from "./tonal-button";

interface AnecdoteFormProps {
  anecdote?: Anecdote;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: (anecdote: AdminAnecdoteResponse) => void;
}

export const AnecdoteForm = ({ anecdote, onDirtyChange, onSaved }: AnecdoteFormProps) => {
  const [text, setText] = useState(anecdote?.text ?? "");
  const [savedText, setSavedText] = useState(anecdote?.text ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveText = useSaveAnecdote();
  const saveImage = useSaveAnecdoteImage();

  const isTextDirty = text !== savedText;
  const isDirty = isTextDirty || file !== null;
  const error = saveText.error ?? saveImage.error;
  const storedText = text.trim();
  const isTooLong = storedText.length > ANECDOTE_MAX_LENGTH;
  const parsed = adminAnecdoteWriteSchema.safeParse({ text });
  const payload = parsed.success ? parsed.data : null;

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (payload === null || isSaving) return;

    setIsSaving(true);
    saveText.reset();
    saveImage.reset();
    try {
      let id = anecdote?.id;
      if (id === undefined || isTextDirty) {
        const stored = await saveText.mutateAsync({ id, anecdote: payload });
        // The contract trimmed the text on the way out, so the textarea shows what was stored.
        setText(stored.text);
        setSavedText(stored.text);
        onSaved(stored);
        id = stored.id;
      }
      if (file !== null) {
        await saveImage.mutateAsync({ id, file });
        setFile(null);
      }
    } catch {
      // The failed mutation holds the API's message, and a failed image keeps its file for a retry.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Anecdote">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          aria-label="Anecdote"
          className={`${CONTROL} resize-y`}
        />
        <p className={`mt-1 text-right text-xs ${isTooLong ? "text-red-600" : "text-zinc-500"}`}>
          {storedText.length} / {ANECDOTE_MAX_LENGTH}
        </p>
      </Field>

      <Field label="Preview">
        <p className="min-h-5">
          <AnecdoteText text={storedText} />
        </p>
      </Field>

      <Field label="Image">
        <ImageDropZone
          imageUrl={anecdote?.imageUrl ?? null}
          imageAlt="Anecdote Image"
          file={file}
          isBusy={isSaving}
          onFileChange={setFile}
        />
      </Field>

      {error ? (
        <p role="alert" className="text-red-600 text-sm">
          {error.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <TonalButton type="submit" isDisabled={!isDirty || payload === null || isSaving}>
          {anecdote === undefined ? "Create Anecdote" : "Save changes"}
        </TonalButton>
      </div>
    </form>
  );
};
