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
  const question = {
    id: "q1",
    themeId: "les-simpson",
    themeName: "Les Simpson",
    text: "Quel est le prénom du fils de Homer ?",
    answer: "Bart",
    aliases: [],
    misspellings: [],
    wrongChoices: ["Lisa", "Maggie", "Milhouse"],
    category: {
      id: "television",
      name: "Télévision",
      color: "#8e24aa",
      secondaryColor: "#f3e5f5",
      icon: "tv",
    },
  };

  it("carries the Question's Category", () => {
    expect(appQuestionDrawResponseSchema.parse([question])).toEqual([question]);
  });

  it("rejects a Question without its Category", () => {
    const { category: _, ...withoutCategory } = question;
    expect(appQuestionDrawResponseSchema.safeParse([withoutCategory]).success).toBe(false);
  });
});
