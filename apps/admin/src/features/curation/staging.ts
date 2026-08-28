import type { Question, Theme } from "./types";

export const READY_QUESTIONS_TO_PUBLISH = 20;

const readyQuestions = (count: number): string =>
  `${count} Ready Question${count === 1 ? "" : "s"}`;

// A Theme too thin to fill a session must never reach players, so the switch stays locked until it can.
export function publishBlocker(readyQuestionCount: number): string | null {
  return readyQuestionCount >= READY_QUESTIONS_TO_PUBLISH
    ? null
    : `${readyQuestions(readyQuestionCount)} of ${READY_QUESTIONS_TO_PUBLISH} — publish once the Theme holds ${READY_QUESTIONS_TO_PUBLISH}.`;
}

// A Published Theme is being served, so nothing may pull its Ready count under the publishing bar.
export function questionFloorBlocker(theme: Theme | undefined, question: Question): string | null {
  if (theme === undefined || !theme.published || !question.readyToBePublished) {
    return null;
  }
  return theme.readyQuestionCount > READY_QUESTIONS_TO_PUBLISH
    ? null
    : `${theme.name} is Published and would drop under ${READY_QUESTIONS_TO_PUBLISH} Ready Questions — unpublish the Theme first.`;
}

// Visible is derived, so unpublishing the Category's last Published Theme takes the Category down too.
export function isCategoryLastPublishedTheme(themes: Theme[], theme: Theme): boolean {
  return (
    theme.published &&
    themes.filter((row) => row.categoryId === theme.categoryId && row.published).length === 1
  );
}

export type StagingConsequence = { title: string; lines: string[]; confirmLabel: string };

export function themeStagingConsequence(
  theme: Theme,
  isLastPublishedOfCategory: boolean,
): StagingConsequence {
  if (!theme.published) {
    return {
      title: `Publish ${theme.name}?`,
      lines: [`Players are served its ${readyQuestions(theme.readyQuestionCount)} right away.`],
      confirmLabel: "Publish",
    };
  }
  return {
    title: `Unpublish ${theme.name}?`,
    lines: [
      `Players stop being served its ${readyQuestions(theme.readyQuestionCount)} right away.`,
      ...(isLastPublishedOfCategory
        ? ["This is the Category's last Published Theme — the Category disappears from the app."]
        : []),
    ],
    confirmLabel: "Unpublish",
  };
}
