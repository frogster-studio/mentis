import { describe, expect, it } from "vitest";
import type { Category, Question } from "@/types/quiz";
import { quickHomeQuestionCounterTag } from "./constants";
import {
  answerTopTile,
  buildDaySet,
  daySetEndMessage,
  isDrawDue,
  type QuickHomeQuestionDaySet,
  topTile,
} from "./day-set";

const HISTOIRE: Category = {
  id: "histoire",
  name: "Histoire",
  color: "#f2c94c",
  secondaryColor: "#fff8e1",
  icon: "account-balance",
};

function question(id: string): Question {
  return {
    id,
    themeId: `theme-${id}`,
    themeName: `Thème ${id}`,
    text: `Question ${id} ?`,
    answer: `Réponse ${id}`,
    aliases: [],
    misspellings: [],
    wrongChoices: [`Faux ${id} 1`, `Faux ${id} 2`, `Faux ${id} 3`],
    category: HISTOIRE,
  };
}

function scriptedRng(...values: number[]): () => number {
  return () => {
    const value = values.shift();
    if (value === undefined) {
      throw new Error("rng called more times than scripted");
    }
    return value;
  };
}

const LATE_APRIL_10 = new Date("2026-04-10T21:59:00.000Z");
const EARLY_APRIL_11 = new Date("2026-04-10T22:00:00.000Z");

const QUESTIONS = [question("a"), question("b"), question("c")];

function daySet(results: boolean[]): QuickHomeQuestionDaySet {
  return {
    ...buildDaySet(QUESTIONS, LATE_APRIL_10, scriptedRng(0, 0, 0, 0, 0, 0)),
    results,
  };
}

describe("buildDaySet", () => {
  it("dates the set by the Europe/Paris day, not the UTC one", () => {
    expect(buildDaySet([], LATE_APRIL_10, scriptedRng()).day).toBe("2026-04-10");
    expect(buildDaySet([], EARLY_APRIL_11, scriptedRng()).day).toBe("2026-04-11");
  });

  it("stores each served Question with its answer-matching pair, unanswered", () => {
    const built = buildDaySet(QUESTIONS, LATE_APRIL_10, scriptedRng(0, 0, 0.4, 0.5, 0.99, 0.2));
    expect(built.tiles).toStrictEqual([
      { question: QUESTIONS[0], choices: ["Réponse a", "Faux a 1"] },
      { question: QUESTIONS[1], choices: ["Faux b 2", "Réponse b"] },
      { question: QUESTIONS[2], choices: ["Réponse c", "Faux c 3"] },
    ]);
    expect(built.results).toStrictEqual([]);
  });

  it.each([0, 1, 2, 3])("gives one tile per Question received, %i included", (received) => {
    const built = buildDaySet(
      QUESTIONS.slice(0, received),
      LATE_APRIL_10,
      scriptedRng(...Array(received * 2).fill(0)),
    );
    expect(built.tiles).toHaveLength(received);
  });
});

describe("isDrawDue", () => {
  it("is due with no stored set", () => {
    expect(isDrawDue(null, LATE_APRIL_10)).toBe(true);
  });

  it("is due once the Paris day turns, even half-answered", () => {
    expect(isDrawDue(daySet([true]), EARLY_APRIL_11)).toBe(true);
  });

  it("is not due on the set's own day, answered or not", () => {
    expect(isDrawDue(daySet([]), LATE_APRIL_10)).toBe(false);
    expect(isDrawDue(daySet([true, false, true]), LATE_APRIL_10)).toBe(false);
  });

  it("is not due again the day an empty set was received", () => {
    expect(isDrawDue(buildDaySet([], LATE_APRIL_10, scriptedRng()), LATE_APRIL_10)).toBe(false);
  });
});

describe("topTile", () => {
  it("is the first unanswered Question, so a relaunch resumes on the next tile", () => {
    expect(topTile(daySet([]))?.question).toBe(QUESTIONS[0]);
    expect(topTile(daySet([false]))?.question).toBe(QUESTIONS[1]);
  });

  it("is none once every Question is answered, or none was received", () => {
    expect(topTile(daySet([true, false, true]))).toBeNull();
    expect(topTile(buildDaySet([], LATE_APRIL_10, scriptedRng()))).toBeNull();
  });
});

describe("answerTopTile", () => {
  it("records the top tile's result by strict equality with the Canonical Answer", () => {
    expect(answerTopTile(daySet([]), "Réponse a").results).toStrictEqual([true]);
    expect(answerTopTile(daySet([true]), "Faux b 1").results).toStrictEqual([true, false]);
    expect(answerTopTile(daySet([true]), "réponse b").results).toStrictEqual([true, false]);
  });

  it("leaves a fully answered set untouched", () => {
    const answered = daySet([true, true, false]);
    expect(answerTopTile(answered, "Réponse a")).toBe(answered);
  });

  it("never mutates the stored set", () => {
    const stored = daySet([]);
    answerTopTile(stored, "Réponse a");
    expect(stored.results).toStrictEqual([]);
  });
});

describe("quickHomeQuestionCounterTag", () => {
  it("reads the answered count over the Questions received", () => {
    const resumed = daySet([true]);
    expect(quickHomeQuestionCounterTag(resumed.results.length, resumed.tiles.length)).toBe(
      "Questions du jour : 1 sur 3",
    );
    expect(quickHomeQuestionCounterTag(0, 2)).toBe("Questions du jour : 0 sur 2");
  });
});

describe("daySetEndMessage", () => {
  it("congratulates one or two right answers out of three", () => {
    expect(daySetEndMessage(daySet([false, true, false]))).toBe(
      "1 question juste sur 3, bien joué !",
    );
    expect(daySetEndMessage(daySet([true, false, true]))).toBe(
      "2 questions justes sur 3, bien joué !",
    );
  });

  it("cheers a perfect set", () => {
    expect(daySetEndMessage(daySet([true, true, true]))).toBe("3 questions justes sur 3, bravo !");
  });

  it("says nothing when no answer was right", () => {
    expect(daySetEndMessage(daySet([false, false, false]))).toBeNull();
  });

  it("counts « sur » over the Questions received when fewer than three came", () => {
    const pair = buildDaySet(QUESTIONS.slice(0, 2), LATE_APRIL_10, scriptedRng(0, 0, 0, 0));
    expect(daySetEndMessage({ ...pair, results: [true, false] })).toBe(
      "1 question juste sur 2, bien joué !",
    );
    expect(daySetEndMessage({ ...pair, results: [true, true] })).toBe(
      "2 questions justes sur 2, bravo !",
    );
  });
});
