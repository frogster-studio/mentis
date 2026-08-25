// Time and the Carré shuffle only arrive through action payloads, so transitions stay pure.

import { matchAnswer } from "@mentis/answer-matching";
import { QuizAnswerModeEnum } from "@mentis/contracts/enums";
import type { Question } from "@/types/quiz";
import { POINTS_CASH, POINTS_SQUARE } from "./constants";
import { isExpired } from "./countdown";
import {
  advanceQuestionPlay,
  hasStandingAnswer,
  type QuestionPlay,
  revealChoices,
  selectChoice,
  standingAnswer,
  startQuestionPlay,
  typeAnswer,
} from "./question-play";

export type SessionAnswer = {
  input: string;
  correct: boolean;
  points: number;
  mode: QuizAnswerModeEnum;
};

export type SessionState = QuestionPlay & {
  questions: Question[];
  answers: SessionAnswer[];
  status: "active" | "finished";
};

export type SessionAction =
  | { type: "setInput"; value: string }
  // `choices` is the shuffled 2×2 grid, computed by the caller with an injected RNG.
  | { type: "switchToSquare"; choices: string[] }
  | { type: "select"; index: number }
  | { type: "confirm"; now: number }
  | { type: "expire"; now: number };

// Precondition: at least one question (the picker only offers eligible Themes).
export function createSession(questions: Question[], now: number): SessionState {
  return { ...startQuestionPlay(now), questions, answers: [], status: "active" };
}

// Only meaningful while the session is active.
export function currentQuestion(state: SessionState): Question {
  return state.questions[state.answers.length];
}

export function sessionScore(answers: SessionAnswer[]): number {
  return answers.reduce((total, answer) => total + answer.points, 0);
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  if (state.status !== "active") {
    return state;
  }
  switch (action.type) {
    case "setInput":
      return typeAnswer(state, action.value);
    case "switchToSquare":
      return revealChoices(state, action.choices);
    case "select":
      return selectChoice(state, action.index);
    case "confirm":
      return hasStandingAnswer(state) ? submit(state, action.now) : state;
    case "expire":
      // Guarded by the wall clock, not the caller: stray or duplicate ticks are harmless.
      return isExpired(state.endsAt, action.now) ? submit(state, action.now) : state;
  }
}

// Takes whatever stands — even empty on expiry — then advances instantly with a fresh Countdown.
function submit(state: SessionState, now: number): SessionState {
  const answers = [...state.answers, judgeStandingAnswer(state)];
  const finished = answers.length === state.questions.length;
  // A finished session shows no Question, so its Countdown must not restart behind the results.
  const advanced = finished ? state : advanceQuestionPlay(state, now);
  return { ...advanced, answers, status: finished ? "finished" : "active" };
}

function judgeStandingAnswer(state: SessionState): SessionAnswer {
  const question = currentQuestion(state);
  const input = standingAnswer(state);

  if (state.mode === QuizAnswerModeEnum.SQUARE) {
    // The Canonical Answer sits among the choices, so an exact match is the whole verdict.
    const correct = input !== "" && input === question.answer;
    return { input, correct, points: correct ? POINTS_SQUARE : 0, mode: QuizAnswerModeEnum.SQUARE };
  }

  const correct = matchAnswer(input, question);
  return { input, correct, points: correct ? POINTS_CASH : 0, mode: QuizAnswerModeEnum.CASH };
}
