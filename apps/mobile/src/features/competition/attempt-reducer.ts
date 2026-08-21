// The same mechanics as practice with no verdict anywhere: the API alone judges what this records.

import type {
  AppCompetitionAttemptResponse,
  AppCompetitionFinalizeInput,
} from "@mentis/contracts/app";
import { elapsedMs, isExpired } from "@/features/quiz/countdown";
import {
  advanceQuestionPlay,
  hasStandingAnswer,
  type QuestionPlay,
  revealChoices,
  selectChoice,
  standingAnswer,
  startQuestionPlay,
  typeAnswer,
} from "@/features/quiz/question-play";
import type { CompetitionQuestion } from "@/types/quiz";

export type PlayedAnswer = AppCompetitionFinalizeInput["answers"][number];

export type AttemptState = QuestionPlay & {
  id: string;
  themeName: string;
  questions: CompetitionQuestion[];
  // The finalize batch as it grows: a prefix of the served order, one entry per resolved position.
  answers: PlayedAnswer[];
  status: "active" | "finished";
};

export type AttemptAction =
  | { type: "setInput"; value: string }
  | { type: "switchToSquare" }
  | { type: "select"; index: number }
  | { type: "confirm"; now: number }
  | { type: "expire"; now: number };

export function createAttempt(attempt: AppCompetitionAttemptResponse, now: number): AttemptState {
  return {
    ...startQuestionPlay(now),
    id: attempt.id,
    themeName: attempt.themeName,
    questions: attempt.questions,
    answers: [],
    status: "active",
  };
}

// Only meaningful while the Attempt is active.
export function currentAttemptQuestion(state: AttemptState): CompetitionQuestion {
  return state.questions[state.answers.length];
}

export function attemptReducer(state: AttemptState, action: AttemptAction): AttemptState {
  if (state.status !== "active") {
    return state;
  }
  switch (action.type) {
    case "setInput":
      return typeAnswer(state, action.value);
    case "switchToSquare":
      // The grid was shuffled at issuance, so switching reveals it rather than draws it.
      return revealChoices(state, currentAttemptQuestion(state).squareChoices);
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
function submit(state: AttemptState, now: number): AttemptState {
  const answers = [...state.answers, recordStandingAnswer(state, now)];
  const finished = answers.length === state.questions.length;
  // A finished Attempt shows no Question, so its Countdown must not restart behind the results.
  const advanced = finished ? state : advanceQuestionPlay(state, now);
  return { ...advanced, answers, status: finished ? "finished" : "active" };
}

function recordStandingAnswer(state: AttemptState, now: number): PlayedAnswer {
  return {
    questionId: currentAttemptQuestion(state).id,
    mode: state.mode,
    rawInput: standingAnswer(state),
    clientElapsedMs: elapsedMs(state.endsAt, now),
  };
}
