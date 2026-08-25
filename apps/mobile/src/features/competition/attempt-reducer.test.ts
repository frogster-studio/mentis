import type { AppCompetitionAttemptResponse } from "@mentis/contracts/app";
import { QuizAnswerModeEnum } from "@mentis/contracts/enums";
import { describe, expect, it } from "vitest";
import { COUNTDOWN_DURATION_MS } from "@/features/quiz/constants";
import {
  type AttemptState,
  attemptReducer,
  createAttempt,
  currentAttemptQuestion,
} from "./attempt-reducer";

const T0 = 1_760_000_000_000;

// The served grid, shuffled by the API: the Canonical Answer sits at index 1 and is not marked.
function squareChoices(position: number): string[] {
  return ["faux un", `bonne réponse ${position}`, "faux deux", "faux trois"];
}

const ISSUED: AppCompetitionAttemptResponse = {
  id: "3f1d4d1e-0f4a-4c9b-9a1a-8f5c2b7d6e01",
  day: "2026-08-21",
  kind: "initial",
  status: "active",
  themeId: "histoire",
  themeName: "Histoire",
  questions: Array.from({ length: 10 }, (_, index) => ({
    id: `q${index + 1}`,
    text: `Question ${index + 1} ?`,
    squareChoices: squareChoices(index + 1),
  })),
};

function activeAttempt(): AttemptState {
  return createAttempt(ISSUED, T0);
}

describe("createAttempt", () => {
  it("starts active at question 1 with a blank answer and a running Countdown", () => {
    const state = activeAttempt();
    expect(state.id).toBe(ISSUED.id);
    expect(state.themeName).toBe("Histoire");
    expect(state.status).toBe("active");
    expect(state.answers).toStrictEqual([]);
    expect(state.input).toBe("");
    expect(state.mode).toBe(QuizAnswerModeEnum.CASH);
    expect(state.choices).toBeNull();
    expect(state.endsAt).toBe(T0 + COUNTDOWN_DURATION_MS);
    expect(currentAttemptQuestion(state)).toBe(ISSUED.questions[0]);
  });
});

describe("the recorded answer", () => {
  it("carries the raw input, the self-reported mode and the claimed elapsed — and nothing else", () => {
    const typed = attemptReducer(activeAttempt(), { type: "setInput", value: "Charlemagne" });
    const state = attemptReducer(typed, { type: "confirm", now: T0 + 9_000 });

    expect(state.answers).toStrictEqual([
      {
        questionId: "q1",
        mode: QuizAnswerModeEnum.CASH,
        rawInput: "Charlemagne",
        clientElapsedMs: 9_000,
      },
    ]);
  });

  it("holds no verdict, no points and no Canonical Answer — the API alone judges", () => {
    const typed = attemptReducer(activeAttempt(), { type: "setInput", value: "bonne réponse 1" });
    const state = attemptReducer(typed, { type: "confirm", now: T0 + 1_000 });

    expect(Object.keys(state.answers[0]).sort()).toStrictEqual([
      "clientElapsedMs",
      "mode",
      "questionId",
      "rawInput",
    ]);
  });

  it("advances with a fresh Countdown", () => {
    const typed = attemptReducer(activeAttempt(), { type: "setInput", value: "Clovis" });
    const state = attemptReducer(typed, { type: "confirm", now: T0 + 9_000 });

    expect(state.input).toBe("");
    expect(state.endsAt).toBe(T0 + 9_000 + COUNTDOWN_DURATION_MS);
    expect(currentAttemptQuestion(state)).toBe(ISSUED.questions[1]);
  });
});

describe("confirm", () => {
  it("is a no-op while nothing but whitespace stands", () => {
    const state = attemptReducer(activeAttempt(), { type: "setInput", value: "   " });
    expect(attemptReducer(state, { type: "confirm", now: T0 + 1_000 })).toBe(state);
  });
});

describe("switchToSquare", () => {
  it("reveals the grid the API shuffled at issuance, without a fresh Countdown", () => {
    const typed = attemptReducer(activeAttempt(), { type: "setInput", value: "à moitié tapé" });
    const state = attemptReducer(typed, { type: "switchToSquare" });

    expect(state.mode).toBe(QuizAnswerModeEnum.SQUARE);
    expect(state.input).toBe("");
    expect(state.choices).toStrictEqual(squareChoices(1));
    expect(state.endsAt).toBe(typed.endsAt);
  });

  it("is one-way: a second switch cannot reset the selection", () => {
    const square = attemptReducer(activeAttempt(), { type: "switchToSquare" });
    const selected = attemptReducer(square, { type: "select", index: 2 });
    expect(attemptReducer(selected, { type: "switchToSquare" })).toBe(selected);
  });

  it("records the highlighted choice verbatim, still unjudged", () => {
    const square = attemptReducer(activeAttempt(), { type: "switchToSquare" });
    const selected = attemptReducer(square, { type: "select", index: 1 });
    const state = attemptReducer(selected, { type: "confirm", now: T0 + 4_000 });

    expect(state.answers[0]).toStrictEqual({
      questionId: "q1",
      mode: QuizAnswerModeEnum.SQUARE,
      rawInput: "bonne réponse 1",
      clientElapsedMs: 4_000,
    });
  });
});

describe("expire", () => {
  it("is a no-op before the end-timestamp", () => {
    const state = activeAttempt();
    expect(attemptReducer(state, { type: "expire", now: state.endsAt - 1 })).toBe(state);
  });

  it("submits an empty Cash answer stamped with the full Countdown", () => {
    const state = activeAttempt();
    const expired = attemptReducer(state, { type: "expire", now: state.endsAt + 40 });

    expect(expired.answers).toStrictEqual([
      {
        questionId: "q1",
        mode: QuizAnswerModeEnum.CASH,
        rawInput: "",
        clientElapsedMs: COUNTDOWN_DURATION_MS,
      },
    ]);
    expect(expired.endsAt).toBe(state.endsAt + 40 + COUNTDOWN_DURATION_MS);
  });

  it("sacrifices at most one question no matter how long the app was away", () => {
    const returnedAt = activeAttempt().endsAt + COUNTDOWN_DURATION_MS * 5;
    const state = attemptReducer(activeAttempt(), { type: "expire", now: returnedAt });

    expect(state.answers).toHaveLength(1);
    expect(state.status).toBe("active");
    expect(currentAttemptQuestion(state)).toBe(ISSUED.questions[1]);
  });
});

describe("the finalize batch", () => {
  function playThrough(count: number): AttemptState {
    let state = activeAttempt();
    for (let index = 0; index < count; index += 1) {
      state = attemptReducer(state, { type: "setInput", value: `réponse ${index + 1}` });
      state = attemptReducer(state, { type: "confirm", now: T0 + (index + 1) * 10_000 });
    }
    return state;
  }

  it("answers by position into the served order", () => {
    const state = playThrough(10);
    expect(state.answers.map((answer) => answer.questionId)).toStrictEqual(
      ISSUED.questions.map((question) => question.id),
    );
  });

  it("finishes after the tenth submission", () => {
    expect(playThrough(10).status).toBe("finished");
  });

  it("is a served prefix when the Player walks out early — the rest never resolved", () => {
    const quit = playThrough(4);
    expect(quit.status).toBe("active");
    expect(quit.answers.map((answer) => answer.questionId)).toStrictEqual(["q1", "q2", "q3", "q4"]);
  });

  it("ignores every action once finished", () => {
    const finished = playThrough(10);
    expect(attemptReducer(finished, { type: "setInput", value: "trop tard" })).toBe(finished);
    expect(attemptReducer(finished, { type: "switchToSquare" })).toBe(finished);
    expect(attemptReducer(finished, { type: "confirm", now: T0 + 999_000 })).toBe(finished);
    expect(attemptReducer(finished, { type: "expire", now: T0 + 999_000 })).toBe(finished);
  });
});

describe("purity", () => {
  it("never mutates the previous state", () => {
    const state = attemptReducer(activeAttempt(), { type: "setInput", value: "Vercingétorix" });
    const snapshot = structuredClone(state);
    attemptReducer(state, { type: "confirm", now: T0 + 3_000 });
    attemptReducer(state, { type: "expire", now: state.endsAt });
    expect(state).toStrictEqual(snapshot);
  });
});
