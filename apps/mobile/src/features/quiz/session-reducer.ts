// Time and the Carré shuffle only arrive through action payloads, so transitions stay pure.

import { matchAnswer } from "@mentis/answer-matching";
import type { Question, QuizMode } from "@/types/quiz";
import { POINTS_CASH, POINTS_SQUARE } from "./constants";
import { endTimestamp, isExpired } from "./countdown";

export type SessionAnswer = {
  input: string;
  correct: boolean;
  points: number;
  mode: QuizMode;
};

export type SessionState = {
  questions: Question[];
  answers: SessionAnswer[];
  input: string;
  // Per current question: Cash until a one-way switch to Carré reveals the choices.
  mode: QuizMode;
  choices: string[] | null;
  selection: number | null;
  endsAt: number;
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
  return {
    questions,
    answers: [],
    input: "",
    mode: "cash",
    choices: null,
    selection: null,
    endsAt: endTimestamp(now),
    status: "active",
  };
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
      // Once in Carré the input is gone for good — the field is no longer shown.
      return state.mode === "square" ? state : { ...state, input: action.value };
    case "switchToSquare":
      // One-way, and only from Cash: keyboard input discarded, Countdown untouched.
      return state.mode === "square"
        ? state
        : { ...state, mode: "square", input: "", choices: action.choices, selection: null };
    case "select":
      // Selection changes freely until submission; a no-op outside Carré.
      return state.mode === "square" ? { ...state, selection: action.index } : state;
    case "confirm":
      // Early confirmation requires a standing answer: text in Cash, a selection in Carré.
      return canConfirm(state) ? submit(state, action.now) : state;
    case "expire":
      // Guarded by the wall clock, not the caller: stray or duplicate ticks are harmless.
      return isExpired(state.endsAt, action.now) ? submit(state, action.now) : state;
  }
}

function canConfirm(state: SessionState): boolean {
  return state.mode === "square" ? state.selection !== null : state.input.trim() !== "";
}

// Takes whatever stands — even empty on expiry — then advances instantly with a fresh Countdown.
function submit(state: SessionState, now: number): SessionState {
  const answers = [...state.answers, resolveAnswer(state)];
  const finished = answers.length === state.questions.length;
  return {
    ...state,
    answers,
    input: "",
    mode: "cash",
    choices: null,
    selection: null,
    status: finished ? "finished" : "active",
    endsAt: finished ? state.endsAt : endTimestamp(now),
  };
}

function resolveAnswer(state: SessionState): SessionAnswer {
  const question = currentQuestion(state);
  if (state.mode === "square") {
    // The Canonical Answer sits among the choices, so an exact match is the whole verdict.
    const chosen = state.selection === null ? "" : (state.choices?.[state.selection] ?? "");
    const correct = chosen !== "" && chosen === question.answer;
    return { input: chosen, correct, points: correct ? POINTS_SQUARE : 0, mode: "square" };
  }
  const correct = matchAnswer(state.input, question);
  return { input: state.input, correct, points: correct ? POINTS_CASH : 0, mode: "cash" };
}
