"use client";

import { type FormEvent, useEffect, useState } from "react";

import { useDeleteQuestion, useSaveQuestion } from "../api";
import { formatChips, parseChips } from "../chips";
import {
  ANSWER_SLOTS,
  blankQuestionForm,
  isQuestionFormDirty,
  type QuestionFormState,
  questionPayloadOf,
  toQuestionForm,
} from "../question-form";
import { readyLabel } from "../staging-labels";
import type { Question, Theme } from "../types";
import { Badge } from "./badge";
import { Chips } from "./chips";
import { CONTROL } from "./control";
import { Field } from "./field";
import { TonalButton } from "./tonal-button";

const SLOT_LABELS = Array.from({ length: ANSWER_SLOTS }, (_slot, index) => `Answer ${index + 1}`);

interface QuestionFormProps {
  question?: Question;
  themes: Theme[];
  selectedThemeId: string | null;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: (question: Question) => void;
  onDeleted: () => void;
}

export const QuestionForm = ({
  question,
  themes,
  selectedThemeId,
  onDirtyChange,
  onSaved,
  onDeleted,
}: QuestionFormProps) => {
  const initialForm = () =>
    question === undefined ? blankQuestionForm(selectedThemeId) : toQuestionForm(question);
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(initialForm);
  const save = useSaveQuestion();
  const remove = useDeleteQuestion();

  const isDirty = isQuestionFormDirty(form, saved);
  const payload = questionPayloadOf(form);

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  const edit = (patch: Partial<QuestionFormState>) =>
    setForm((current) => ({ ...current, ...patch }));

  const editAnswer = (slot: number, value: string) =>
    setForm((current) => ({
      ...current,
      answers: current.answers.map((answer, index) => (index === slot ? value : answer)),
    }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (payload === null) {
      return;
    }
    save.mutate(
      { id: question?.id, question: payload },
      {
        // The contract lowercased the chips on the way out, so the inputs show what was stored.
        onSuccess: (stored) => {
          const asStored = {
            ...form,
            aliases: formatChips(stored.aliases),
            misspellings: formatChips(stored.misspellings),
          };
          setForm(asStored);
          setSaved(asStored);
          onSaved(stored);
        },
      },
    );
  };

  const onDelete = () => {
    if (question === undefined || !window.confirm("Delete this Question for good?")) {
      return;
    }
    remove.mutate(question.id, { onSuccess: onDeleted });
  };

  const isBusy = save.isPending || remove.isPending;
  const error = save.error ?? remove.error;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Theme">
        <select
          value={form.themeId}
          onChange={(event) => edit({ themeId: event.target.value })}
          className={CONTROL}
        >
          <option value="">Select a Theme</option>
          {[...themes]
            .sort((left, right) => left.name.localeCompare(right.name))
            .map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
        </select>
      </Field>

      <Field label="Question">
        <textarea
          value={form.text}
          onChange={(event) => edit({ text: event.target.value })}
          rows={3}
          className={CONTROL}
        />
      </Field>

      <Field label="Answers">
        <div className="flex flex-col gap-2">
          {SLOT_LABELS.map((label, slot) => (
            <label key={label} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-answer"
                checked={form.correctSlot === slot}
                onChange={() => edit({ correctSlot: slot })}
                aria-label={`${label} is the correct one`}
                className="size-4 shrink-0 accent-sky-600"
              />
              <input
                type="text"
                value={form.answers[slot] ?? ""}
                onChange={(event) => editAnswer(slot, event.target.value)}
                aria-label={label}
                className={CONTROL}
              />
            </label>
          ))}
        </div>
      </Field>

      <Field label="Aliases">
        <input
          type="text"
          value={form.aliases}
          onChange={(event) => edit({ aliases: event.target.value })}
          placeholder="Separate with commas"
          className={CONTROL}
        />
        <div className="mt-2">
          <Chips values={parseChips(form.aliases)} />
        </div>
      </Field>

      <Field label="Misspellings">
        <input
          type="text"
          value={form.misspellings}
          onChange={(event) => edit({ misspellings: event.target.value })}
          placeholder="Separate with commas"
          className={CONTROL}
        />
        <div className="mt-2">
          <Chips values={parseChips(form.misspellings)} />
        </div>
      </Field>

      {question ? (
        <Field label="Staging">
          <Badge isOn={question.readyToBePublished}>
            {readyLabel(question.readyToBePublished)}
          </Badge>
        </Field>
      ) : null}

      {error ? (
        <p role="alert" className="text-red-600 text-sm">
          {error.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <TonalButton type="submit" isDisabled={!isDirty || payload === null || isBusy}>
          {question === undefined ? "Create Question" : "Save changes"}
        </TonalButton>
        {question ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={isBusy}
            className="text-sm text-zinc-500 transition-colors hover:text-red-600 disabled:text-zinc-300"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
};
