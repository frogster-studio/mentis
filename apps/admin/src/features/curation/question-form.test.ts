import { describe, expect, it } from "vitest";

import {
  blankQuestionForm,
  isQuestionFormDirty,
  type QuestionFormState,
  questionPayloadOf,
  toQuestionForm,
} from "./question-form";
import type { Question } from "./types";

const SIMPSON = "5c2e0d3a-0000-4000-8000-000000000001";

const question: Question = {
  id: "9a3e0d3a-0000-4000-8000-000000000001",
  themeId: SIMPSON,
  text: "Quelle est la capitale de l'Australie ?",
  answer: "Canberra",
  aliases: ["canbera city"],
  misspellings: ["camberra"],
  wrongChoices: ["Sydney", "Melbourne", "Perth"],
  readyToBePublished: true,
};

const complete: QuestionFormState = {
  themeId: SIMPSON,
  text: "Quelle est la capitale de l'Australie ?",
  answers: ["Sydney", "Canberra", "Melbourne", "Perth"],
  correctSlot: 1,
  aliases: "Canbera City",
  misspellings: "CAMBERRA",
};

describe("blankQuestionForm", () => {
  it("opens on the selected Theme with four empty slots", () => {
    expect(blankQuestionForm(SIMPSON)).toEqual({
      themeId: SIMPSON,
      text: "",
      answers: ["", "", "", ""],
      correctSlot: 0,
      aliases: "",
      misspellings: "",
    });
  });
});

describe("toQuestionForm", () => {
  it("lays the stored Question out over the four slots, the correct one first", () => {
    expect(toQuestionForm(question)).toEqual({
      themeId: SIMPSON,
      text: "Quelle est la capitale de l'Australie ?",
      answers: ["Canberra", "Sydney", "Melbourne", "Perth"],
      correctSlot: 0,
      aliases: "canbera city",
      misspellings: "camberra",
    });
  });

  // The Catalog predates the dashboard, so a short stored Question still opens on four slots.
  it("pads a Question stored with too few wrong choices", () => {
    expect(toQuestionForm({ ...question, wrongChoices: ["Sydney"] }).answers).toEqual([
      "Canberra",
      "Sydney",
      "",
      "",
    ]);
  });
});

describe("questionPayloadOf", () => {
  it("maps the designated slot to the Canonical Answer and the rest to wrong choices", () => {
    expect(questionPayloadOf(complete)).toEqual({
      themeId: SIMPSON,
      text: "Quelle est la capitale de l'Australie ?",
      answer: "Canberra",
      wrongChoices: ["Sydney", "Melbourne", "Perth"],
      aliases: ["canbera city"],
      misspellings: ["camberra"],
    });
  });

  it("round-trips a stored Question unchanged", () => {
    expect(questionPayloadOf(toQuestionForm(question))).toEqual({
      themeId: SIMPSON,
      text: question.text,
      answer: "Canberra",
      wrongChoices: ["Sydney", "Melbourne", "Perth"],
      aliases: ["canbera city"],
      misspellings: ["camberra"],
    });
  });

  it.each([
    ["no Theme", { themeId: "" }],
    ["no text", { text: "  " }],
    ["an empty slot", { answers: ["Sydney", "Canberra", "Melbourne", ""] }],
    ["a repeated answer", { answers: ["Sydney", "Canberra", "canberra", "Perth"] }],
    ["nothing typed at all", blankQuestionForm(SIMPSON)],
  ])("refuses to build a payload with %s", (_case, incomplete) => {
    expect(questionPayloadOf({ ...complete, ...incomplete })).toBeNull();
  });
});

describe("isQuestionFormDirty", () => {
  it("stays clean while nothing was touched", () => {
    expect(isQuestionFormDirty(complete, complete)).toBe(false);
  });

  it.each([
    ["the Theme moved", { themeId: "5c2e0d3a-0000-4000-8000-000000000002" }],
    ["the text changed", { text: "Autre chose ?" }],
    ["an answer slot changed", { answers: ["Sydney", "Canberra", "Melbourne", "Darwin"] }],
    ["the correct slot moved", { correctSlot: 2 }],
    ["a chip was typed", { aliases: "Canbera City, ACT" }],
    ["a misspelling was typed", { misspellings: "" }],
  ])("goes dirty once %s", (_case, edit) => {
    expect(isQuestionFormDirty({ ...complete, ...edit }, complete)).toBe(true);
  });
});
