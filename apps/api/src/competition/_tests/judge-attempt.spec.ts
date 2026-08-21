import { COMPETITION_POINTS, COMPETITION_QUESTION_COUNT } from "@mentis/contracts/app";
import { describe, expect, it } from "vitest";
import type { JudgeableQuestion } from "../types/judgeable-question";
import { attemptScore, judgeAttempt } from "../utils/judge-attempt";

const ATTEMPT = "30000000-0000-4000-8000-000000000020";

// Real content shapes: the verdicts below are the practice rules on the material they run on.
const QUESTIONS: JudgeableQuestion[] = [
  { id: "q0", answer: "Paris", aliases: ["Ville Lumière"], misspellings: ["Pari"] },
  { id: "q1", answer: "Élysée", aliases: ["Palais de l'Élysée"], misspellings: [] },
  { id: "q2", answer: "États-Unis", aliases: ["USA", "Amérique"], misspellings: ["Etats Unys"] },
  { id: "q3", answer: "Molière", aliases: ["Jean-Baptiste Poquelin"], misspellings: [] },
  { id: "q4", answer: "1789", aliases: [], misspellings: [] },
  { id: "q5", answer: "Vercingétorix", aliases: [], misspellings: [] },
  { id: "q6", answer: "Chrysanthème", aliases: [], misspellings: ["krisantème"] },
  { id: "q7", answer: "Seine", aliases: [], misspellings: [] },
  { id: "q8", answer: "Côte d'Ivoire", aliases: [], misspellings: [] },
  { id: "q9", answer: "Or", aliases: [], misspellings: [] },
];

const played = (position: number, rawInput: string, mode: "cash" | "square" = "cash") => ({
  questionId: QUESTIONS[position].id,
  mode,
  rawInput,
  clientElapsedMs: 4200 + position,
});

const judge = (answers: ReturnType<typeof played>[]) =>
  judgeAttempt(ATTEMPT, QUESTIONS, { answers });

const rules = (answers: ReturnType<typeof played>[]) =>
  judge(answers).map((answer) => answer.matchedVia);

describe("judgeAttempt — verdicts match practice exactly", () => {
  it("names the rule that fired, exact hits before fuzzy", () => {
    expect(
      rules([
        played(0, "Paris"),
        played(1, "Palais de l'Élysée"),
        played(2, "USA"),
        played(3, "maliera"),
        played(4, "1789"),
        played(5, "versingetorix"),
        played(6, "krisantème"),
        played(7, "Seine"),
        played(8, "cote divoire"),
        played(9, "Or"),
      ]),
    ).toEqual([
      "canonical",
      "alias",
      "alias",
      "fuzzy",
      "canonical",
      "fuzzy",
      "misspelling",
      "canonical",
      "fuzzy",
      "canonical",
    ]);
  });

  it("keeps fuzzy tolerance off the Misspellings, off numbers and off short answers", () => {
    expect(
      rules([
        played(0, "Pari"),
        played(1, "Élysée"),
        played(2, "amerqiue"),
        played(3, "Molière"),
        // A one-digit miss on a year and a typo of a curated Misspelling both stay wrong.
        played(4, "1790"),
        played(5, "Vercingétorix"),
        played(6, "krisantem"),
        played(7, "Seine"),
        played(8, "Côte d'Ivoire"),
        played(9, "ore"),
      ]),
    ).toEqual([
      "misspelling",
      "canonical",
      "fuzzy",
      "canonical",
      null,
      "canonical",
      null,
      "canonical",
      "canonical",
      null,
    ]);
  });

  it("judges Carré on the chosen text alone, and an empty choice is never right", () => {
    const judged = judge([played(0, "Paris", "square"), played(1, "faux", "square")]);
    expect(judged[0]).toMatchObject({ correct: true, matchedVia: "choice" });
    expect(judged[1]).toMatchObject({ correct: false, matchedVia: null });
    expect(judge([played(0, "", "square")])[0].correct).toBe(false);
  });
});

describe("judgeAttempt — pricing and zero-fill", () => {
  it("prices on the self-reported mode alone — Carré pays 2 even on the Canonical Answer", () => {
    const judged = judge([played(0, "Paris", "square"), played(1, "Élysée")]);
    expect(judged[0].points).toBe(COMPETITION_POINTS.square);
    expect(judged[1].points).toBe(COMPETITION_POINTS.cash);
  });

  it("scores a wrong answer at nothing whatever the mode", () => {
    const judged = judge([played(0, "Lyon"), played(1, "faux", "square")]);
    expect(judged.map((answer) => answer.points).slice(0, 2)).toEqual([0, 0]);
  });

  it("zero-fills every position the batch never reached", () => {
    const judged = judge([played(0, "Paris")]);
    expect(judged).toHaveLength(COMPETITION_QUESTION_COUNT);
    expect(judged[1]).toStrictEqual({
      attemptId: ATTEMPT,
      position: 1,
      questionId: "q1",
      mode: "none",
      rawInput: null,
      correct: false,
      points: 0,
      matchedVia: null,
      clientElapsedMs: null,
    });
    expect(attemptScore(judged)).toBe(COMPETITION_POINTS.cash);
  });

  it("carries the phone's claimed elapsed through untouched", () => {
    expect(judge([played(0, "Paris")])[0].clientElapsedMs).toBe(4200);
  });
});

describe("judgeAttempt — the served Attempt is the only thing answerable", () => {
  it("rejects an answer targeting a Question the Attempt never served", () => {
    expect(() => judge([{ ...played(0, "Paris"), questionId: "alpha-q0" }])).toThrow(
      /not the Question served there/,
    );
  });

  it("rejects a served Question answered at the wrong position", () => {
    expect(() => judge([played(1, "Élysée"), played(0, "Paris")])).toThrow();
  });
});
