import { describe, expect, it } from "vitest";
import { appQuestionDrawQuerySchema, appQuestionDrawResponseSchema } from "./question";

describe("appQuestionDrawQuerySchema", () => {
  it("draws 10 across every Theme when nothing is asked for", () => {
    expect(appQuestionDrawQuerySchema.parse({})).toEqual({ n: 10 });
  });

  it("coerces the query string n", () => {
    expect(appQuestionDrawQuerySchema.parse({ theme: "les-simpson", n: "25" })).toEqual({
      theme: "les-simpson",
      n: 25,
    });
  });

  it("rejects n outside 1-50", () => {
    expect(appQuestionDrawQuerySchema.safeParse({ n: "0" }).success).toBe(false);
    expect(appQuestionDrawQuerySchema.safeParse({ n: "51" }).success).toBe(false);
    expect(appQuestionDrawQuerySchema.safeParse({ n: "1.5" }).success).toBe(false);
  });

  it("rejects an empty theme", () => {
    expect(appQuestionDrawQuerySchema.safeParse({ theme: "" }).success).toBe(false);
  });
});

describe("appQuestionDrawResponseSchema", () => {
  const drawn = {
    id: "q1",
    themeId: "les-simpson",
    themeName: "Les Simpson",
    text: "Quelle ville ?",
    answer: "Springfield",
    aliases: [],
    misspellings: [],
    wrongChoices: ["Shelbyville", "Ogdenville", "Capital City"],
  };

  it("carries the Explanation, a string or null", () => {
    const explained = { ...drawn, explanation: "Dans **aucun** État." };
    expect(appQuestionDrawResponseSchema.parse([explained])).toEqual([explained]);
    const unexplained = { ...drawn, explanation: null };
    expect(appQuestionDrawResponseSchema.parse([unexplained])).toEqual([unexplained]);
  });

  it("rejects a drawn Question without its explanation key", () => {
    expect(appQuestionDrawResponseSchema.safeParse([drawn]).success).toBe(false);
  });
});
