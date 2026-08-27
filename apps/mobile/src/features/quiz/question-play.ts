import { QuizAnswerModeEnum } from "@mentis/contracts/enums";
import { endTimestamp } from "./countdown";

export type QuestionPlay = {
  input: string;
  // Cash until a one-way switch to Carré reveals the choices.
  mode: QuizAnswerModeEnum;
  choices: string[] | null;
  selection: number | null;
  endsAt: number;
};

// The next Question opens instantly on a fresh Countdown; nothing about the last one carries over.
export function advanceQuestionPlay<T extends QuestionPlay>(play: T, now: number): T {
  return { ...play, ...startQuestionPlay(now) };
}

export function startQuestionPlay(now: number): QuestionPlay {
  return {
    input: "",
    mode: QuizAnswerModeEnum.CASH,
    choices: null,
    selection: null,
    endsAt: endTimestamp(now),
  };
}

export function typeAnswer<T extends QuestionPlay>(play: T, value: string): T {
  // Once in Carré the input is gone for good — the field is no longer shown.
  return play.mode === QuizAnswerModeEnum.SQUARE ? play : { ...play, input: value };
}

export function revealChoices<T extends QuestionPlay>(play: T, choices: string[]): T {
  // One-way, and only from Cash: keyboard input discarded, Countdown untouched.
  return play.mode === QuizAnswerModeEnum.SQUARE
    ? play
    : { ...play, mode: QuizAnswerModeEnum.SQUARE, input: "", choices, selection: null };
}

export function selectChoice<T extends QuestionPlay>(play: T, index: number): T {
  // Selection changes freely until submission; a no-op outside Carré.
  return play.mode === QuizAnswerModeEnum.SQUARE ? { ...play, selection: index } : play;
}

// Early confirmation requires a standing answer: text in Cash, a selection in Carré.
export function hasStandingAnswer(play: QuestionPlay): boolean {
  return play.mode === QuizAnswerModeEnum.SQUARE
    ? play.selection !== null
    : play.input.trim() !== "";
}

// Whatever stands right now: the highlighted choice in Carré, the typed text in Cash.
export function standingAnswer(play: QuestionPlay): string {
  if (play.mode !== QuizAnswerModeEnum.SQUARE) {
    return play.input;
  }
  return play.selection === null ? "" : (play.choices?.[play.selection] ?? "");
}
