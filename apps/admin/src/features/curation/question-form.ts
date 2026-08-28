import { type AdminQuestionWrite, adminQuestionWriteSchema } from "@mentis/contracts/admin";

import { formatChips, parseChips } from "./chips";
import type { Question } from "./types";

export const ANSWER_SLOTS = 4;

export type QuestionFormState = {
  themeId: string;
  text: string;
  answers: string[];
  correctSlot: number;
  aliases: string;
  misspellings: string;
};

const emptySlots = (): string[] => Array.from({ length: ANSWER_SLOTS }, () => "");

export function blankQuestionForm(themeId: string | null): QuestionFormState {
  return {
    themeId: themeId ?? "",
    text: "",
    answers: emptySlots(),
    correctSlot: 0,
    aliases: "",
    misspellings: "",
  };
}

// Storage knows no slots: the Canonical Answer takes the first one, the wrong choices follow.
export function toQuestionForm(question: Question): QuestionFormState {
  const stored = [question.answer, ...question.wrongChoices];
  return {
    themeId: question.themeId,
    text: question.text,
    answers: emptySlots().map((slot, index) => stored[index] ?? slot),
    correctSlot: 0,
    aliases: formatChips(question.aliases),
    misspellings: formatChips(question.misspellings),
  };
}

// Null until the form is complete, so the same contract decides what the save button may send.
export function questionPayloadOf(form: QuestionFormState): AdminQuestionWrite | null {
  const parsed = adminQuestionWriteSchema.safeParse({
    themeId: form.themeId,
    text: form.text,
    answer: form.answers[form.correctSlot] ?? "",
    wrongChoices: form.answers.filter((_slot, index) => index !== form.correctSlot),
    aliases: parseChips(form.aliases),
    misspellings: parseChips(form.misspellings),
  });
  return parsed.success ? parsed.data : null;
}

export function isQuestionFormDirty(form: QuestionFormState, saved: QuestionFormState): boolean {
  return (
    form.themeId !== saved.themeId ||
    form.text !== saved.text ||
    form.correctSlot !== saved.correctSlot ||
    form.aliases !== saved.aliases ||
    form.misspellings !== saved.misspellings ||
    form.answers.some((answer, index) => answer !== saved.answers[index])
  );
}
