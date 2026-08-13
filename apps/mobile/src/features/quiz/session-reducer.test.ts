import { describe, expect, it } from "vitest";
import type { Question } from "@/types/quiz";
import { COUNTDOWN_DURATION_MS, POINTS_CASH, POINTS_SQUARE } from "./constants";
import { isExpired } from "./countdown";
import {
  createSession,
  currentQuestion,
  type SessionState,
  sessionReducer,
  sessionScore,
} from "./session-reducer";

const T0 = 1_760_000_000_000;

function question(id: string, answer: string): Question {
  return {
    id,
    themeId: "histoire",
    themeName: "Histoire",
    text: `Question ${id} ?`,
    answer,
    aliases: [],
    misspellings: [],
    wrongChoices: ["faux un", "faux deux", "faux trois"],
  };
}

// The shuffled 2×2 grid the component would hand to `switchToSquare`; the Canonical
// Answer for question n is `bonne réponse n`, sitting among its three wrong choices.
function squareGrid(id: number): string[] {
  return ["faux un", `bonne réponse ${id}`, "faux deux", "faux trois"];
}

const QUESTIONS = Array.from({ length: 10 }, (_, i) =>
  question(`q${i + 1}`, `bonne réponse ${i + 1}`),
);

function activeSession(): SessionState {
  return createSession(QUESTIONS, T0);
}

describe("createSession", () => {
  it("starts active at question 1 with an empty input and a running Countdown", () => {
    const state = activeSession();
    expect(state.status).toBe("active");
    expect(state.answers).toStrictEqual([]);
    expect(state.input).toBe("");
    expect(state.mode).toBe("cash");
    expect(state.choices).toBeNull();
    expect(state.selection).toBeNull();
    expect(state.endsAt).toBe(T0 + COUNTDOWN_DURATION_MS);
    expect(currentQuestion(state)).toBe(QUESTIONS[0]);
  });
});

describe("setInput", () => {
  it("replaces the standing input", () => {
    const state = sessionReducer(activeSession(), { type: "setInput", value: "Berlin" });
    expect(state.input).toBe("Berlin");
  });
});

describe("confirm", () => {
  it("is a no-op while no character stands", () => {
    const state = activeSession();
    expect(sessionReducer(state, { type: "confirm", now: T0 + 1_000 })).toBe(state);
  });

  it("is a no-op when only whitespace stands", () => {
    const state = sessionReducer(activeSession(), { type: "setInput", value: "   " });
    expect(sessionReducer(state, { type: "confirm", now: T0 + 1_000 })).toBe(state);
  });

  it("submits the standing input and advances with a fresh Countdown", () => {
    const typed = sessionReducer(activeSession(), { type: "setInput", value: "bonne réponse 1" });
    const state = sessionReducer(typed, { type: "confirm", now: T0 + 9_000 });
    expect(state.answers).toStrictEqual([
      { input: "bonne réponse 1", correct: true, points: POINTS_CASH, mode: "cash" },
    ]);
    expect(state.input).toBe("");
    expect(state.status).toBe("active");
    expect(state.endsAt).toBe(T0 + 9_000 + COUNTDOWN_DURATION_MS);
    expect(currentQuestion(state)).toBe(QUESTIONS[1]);
  });

  it("judges the Answer through the matching engine, not string equality", () => {
    const typed = sessionReducer(activeSession(), {
      type: "setInput",
      value: "La BONNE réponsse 1",
    });
    const state = sessionReducer(typed, { type: "confirm", now: T0 + 5_000 });
    expect(state.answers[0]).toMatchObject({ correct: true, points: POINTS_CASH });
  });

  it("scores 0 for a wrong answer, without feedback in the state shape", () => {
    const typed = sessionReducer(activeSession(), { type: "setInput", value: "tout autre chose" });
    const state = sessionReducer(typed, { type: "confirm", now: T0 + 5_000 });
    expect(state.answers[0]).toMatchObject({ correct: false, points: 0 });
    expect(state.status).toBe("active");
  });
});

describe("expire", () => {
  it("is a no-op before the end-timestamp", () => {
    const state = sessionReducer(activeSession(), { type: "setInput", value: "presque" });
    expect(sessionReducer(state, { type: "expire", now: state.endsAt - 1 })).toBe(state);
  });

  it("submits the standing text exactly at the end-timestamp", () => {
    const typed = sessionReducer(activeSession(), { type: "setInput", value: "bonne réponse 1" });
    const state = sessionReducer(typed, { type: "expire", now: typed.endsAt });
    expect(state.answers[0]).toMatchObject({ correct: true, points: POINTS_CASH });
    expect(currentQuestion(state)).toBe(QUESTIONS[1]);
  });

  it("submits an empty Answer when nothing stands", () => {
    const state = activeSession();
    const expired = sessionReducer(state, { type: "expire", now: state.endsAt + 40 });
    expect(expired.answers).toStrictEqual([{ input: "", correct: false, points: 0, mode: "cash" }]);
    expect(expired.endsAt).toBe(state.endsAt + 40 + COUNTDOWN_DURATION_MS);
  });
});

describe("interruption — expiry while backgrounded", () => {
  // Because each Countdown is an absolute end-timestamp, a hidden tab or a backgrounded
  // app never pauses it. On return the clock jumps far past `endsAt`, yet a single
  // `expire` must still consume exactly one question — a question's 25s only start when
  // it is shown, so the rest never expire in cascade.

  it("resolves the standing Answer and starts the next question with a full, un-expired Countdown", () => {
    const typed = sessionReducer(activeSession(), { type: "setInput", value: "bonne réponse 1" });
    // Returned 30s after this question's end-timestamp — the app was away past expiry.
    const returnedAt = typed.endsAt + 30_000;
    const state = sessionReducer(typed, { type: "expire", now: returnedAt });

    expect(state.answers).toHaveLength(1);
    expect(state.answers[0]).toMatchObject({ correct: true, points: POINTS_CASH });
    expect(currentQuestion(state)).toBe(QUESTIONS[1]);
    // Next question's timer is anchored to the return clock, not the stale one: a fresh
    // 25s that is not already expired against that same `now` (no cascade of expiries).
    expect(state.endsAt).toBe(returnedAt + COUNTDOWN_DURATION_MS);
    expect(isExpired(state.endsAt, returnedAt)).toBe(false);
  });

  it("sacrifices at most one question no matter how long the app was away", () => {
    // Away for five whole question-durations; only the shown question is consumed.
    const returnedAt = activeSession().endsAt + COUNTDOWN_DURATION_MS * 5;
    const state = sessionReducer(activeSession(), { type: "expire", now: returnedAt });

    expect(state.answers).toStrictEqual([{ input: "", correct: false, points: 0, mode: "cash" }]);
    expect(state.status).toBe("active");
    expect(currentQuestion(state)).toBe(QUESTIONS[1]);
    expect(isExpired(state.endsAt, returnedAt)).toBe(false);
  });
});

describe("switchToSquare", () => {
  it("reveals the choices, wipes typed input, and leaves the Countdown running", () => {
    const typed = sessionReducer(activeSession(), { type: "setInput", value: "à moitié tapé" });
    const state = sessionReducer(typed, { type: "switchToSquare", choices: squareGrid(1) });
    expect(state.mode).toBe("square");
    expect(state.input).toBe("");
    expect(state.choices).toStrictEqual(squareGrid(1));
    expect(state.selection).toBeNull();
    expect(state.endsAt).toBe(typed.endsAt);
  });

  it("is one-way: a second switch cannot re-shuffle or reset the selection", () => {
    const square = sessionReducer(activeSession(), {
      type: "switchToSquare",
      choices: squareGrid(1),
    });
    const selected = sessionReducer(square, { type: "select", index: 2 });
    expect(sessionReducer(selected, { type: "switchToSquare", choices: squareGrid(2) })).toBe(
      selected,
    );
  });
});

describe("select", () => {
  function squareSession(): SessionState {
    return sessionReducer(activeSession(), { type: "switchToSquare", choices: squareGrid(1) });
  }

  it("highlights the tapped choice", () => {
    const state = sessionReducer(squareSession(), { type: "select", index: 3 });
    expect(state.selection).toBe(3);
  });

  it("lets the player change their mind freely before submitting", () => {
    let state = sessionReducer(squareSession(), { type: "select", index: 0 });
    state = sessionReducer(state, { type: "select", index: 2 });
    expect(state.selection).toBe(2);
  });

  it("is a no-op in Cash mode (no choices are shown yet)", () => {
    const cash = activeSession();
    expect(sessionReducer(cash, { type: "select", index: 1 })).toBe(cash);
  });
});

describe("Carré confirmation and expiry", () => {
  function squareSession(): SessionState {
    return sessionReducer(activeSession(), { type: "switchToSquare", choices: squareGrid(1) });
  }

  it("cannot confirm until a choice is selected", () => {
    const state = squareSession();
    expect(sessionReducer(state, { type: "confirm", now: T0 + 1_000 })).toBe(state);
  });

  it("scores +2 for the Canonical Answer and records the Carré mode", () => {
    // squareGrid(1) holds `bonne réponse 1` at index 1.
    const selected = sessionReducer(squareSession(), { type: "select", index: 1 });
    const state = sessionReducer(selected, { type: "confirm", now: T0 + 4_000 });
    expect(state.answers).toStrictEqual([
      { input: "bonne réponse 1", correct: true, points: POINTS_SQUARE, mode: "square" },
    ]);
    expect(state.endsAt).toBe(T0 + 4_000 + COUNTDOWN_DURATION_MS);
  });

  it("scores 0 for a wrong choice", () => {
    const selected = sessionReducer(squareSession(), { type: "select", index: 0 });
    const state = sessionReducer(selected, { type: "confirm", now: T0 + 4_000 });
    expect(state.answers[0]).toStrictEqual({
      input: "faux un",
      correct: false,
      points: 0,
      mode: "square",
    });
  });

  it("submits the highlighted selection when the Countdown expires", () => {
    const selected = sessionReducer(squareSession(), { type: "select", index: 1 });
    const state = sessionReducer(selected, { type: "expire", now: selected.endsAt });
    expect(state.answers[0]).toMatchObject({
      correct: true,
      points: POINTS_SQUARE,
      mode: "square",
    });
  });

  it("submits an empty, zero-point Carré answer when nothing was selected at expiry", () => {
    const state = squareSession();
    const expired = sessionReducer(state, { type: "expire", now: state.endsAt });
    expect(expired.answers[0]).toStrictEqual({
      input: "",
      correct: false,
      points: 0,
      mode: "square",
    });
  });

  it("restarts the next question in Cash with the choices cleared", () => {
    const selected = sessionReducer(squareSession(), { type: "select", index: 1 });
    const state = sessionReducer(selected, { type: "confirm", now: T0 + 4_000 });
    expect(state.mode).toBe("cash");
    expect(state.choices).toBeNull();
    expect(state.selection).toBeNull();
    expect(currentQuestion(state)).toBe(QUESTIONS[1]);
  });
});

describe("finishing", () => {
  function playThrough(correctCount: number): SessionState {
    let state = activeSession();
    for (let i = 0; i < QUESTIONS.length; i += 1) {
      const value = i < correctCount ? `bonne réponse ${i + 1}` : "mauvaise réponse";
      state = sessionReducer(state, { type: "setInput", value });
      state = sessionReducer(state, { type: "confirm", now: T0 + (i + 1) * 10_000 });
    }
    return state;
  }

  it("finishes after the tenth submission with the matching-engine score", () => {
    const state = playThrough(7);
    expect(state.status).toBe("finished");
    expect(state.answers).toHaveLength(10);
    expect(sessionScore(state.answers)).toBe(7 * POINTS_CASH);
  });

  it("ignores every action once finished", () => {
    const finished = playThrough(3);
    expect(sessionReducer(finished, { type: "setInput", value: "trop tard" })).toBe(finished);
    expect(sessionReducer(finished, { type: "switchToSquare", choices: squareGrid(1) })).toBe(
      finished,
    );
    expect(sessionReducer(finished, { type: "select", index: 0 })).toBe(finished);
    expect(sessionReducer(finished, { type: "confirm", now: T0 + 999_000 })).toBe(finished);
    expect(sessionReducer(finished, { type: "expire", now: T0 + 999_000 })).toBe(finished);
  });
});

describe("sessionScore", () => {
  it("is 0 with no answers", () => {
    expect(sessionScore([])).toBe(0);
  });

  it("sums the points of every answer", () => {
    expect(
      sessionScore([
        { input: "a", correct: true, points: POINTS_CASH, mode: "cash" },
        { input: "", correct: false, points: 0, mode: "cash" },
        { input: "b", correct: true, points: POINTS_SQUARE, mode: "square" },
      ]),
    ).toBe(POINTS_CASH + POINTS_SQUARE);
  });
});

describe("mixed Cash/Carré session", () => {
  it("combines +5 Cash and +2 Carré verdicts into the final total", () => {
    let state = activeSession();
    for (let i = 0; i < QUESTIONS.length; i += 1) {
      if (i % 2 === 0) {
        // Even questions answered correctly in Cash (+5 each, 5 of them).
        state = sessionReducer(state, { type: "setInput", value: `bonne réponse ${i + 1}` });
      } else {
        // Odd questions bailed to Carré and answered correctly (+2 each, 5 of them).
        state = sessionReducer(state, { type: "switchToSquare", choices: squareGrid(i + 1) });
        state = sessionReducer(state, { type: "select", index: 1 });
      }
      state = sessionReducer(state, { type: "confirm", now: T0 + (i + 1) * 10_000 });
    }
    expect(state.status).toBe("finished");
    expect(state.answers.filter((a) => a.mode === "square")).toHaveLength(5);
    expect(sessionScore(state.answers)).toBe(5 * POINTS_CASH + 5 * POINTS_SQUARE);
  });
});

describe("purity", () => {
  it("never mutates the previous state", () => {
    const state = sessionReducer(activeSession(), { type: "setInput", value: "bonne réponse 1" });
    const snapshot = structuredClone(state);
    sessionReducer(state, { type: "confirm", now: T0 + 3_000 });
    sessionReducer(state, { type: "expire", now: state.endsAt });
    expect(state).toStrictEqual(snapshot);
  });

  it("never mutates the previous state on the Carré transitions", () => {
    const state = sessionReducer(activeSession(), {
      type: "switchToSquare",
      choices: squareGrid(1),
    });
    const snapshot = structuredClone(state);
    sessionReducer(state, { type: "select", index: 2 });
    sessionReducer(state, { type: "confirm", now: T0 + 3_000 });
    expect(state).toStrictEqual(snapshot);
  });
});
