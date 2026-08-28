import { describe, expect, it } from "vitest";
import { adminQuestionListQuerySchema, adminQuestionListResponseSchema } from "./question";

const THEME_ID = "5c2e0d3a-0000-4000-8000-000000000001";

const question = {
  id: "9a3e0d3a-0000-4000-8000-000000000001",
  themeId: THEME_ID,
  text: "Quelle est la capitale de l'Australie ?",
  answer: "Canberra",
  aliases: ["canbera city"],
  misspellings: ["camberra"],
  wrongChoices: ["Sydney", "Melbourne", "Perth"],
  readyToBePublished: false,
};

describe("adminQuestionListQuerySchema", () => {
  it("takes the Theme whose Questions are listed", () => {
    expect(adminQuestionListQuerySchema.parse({ themeId: THEME_ID })).toEqual({
      themeId: THEME_ID,
    });
  });

  it.each([{}, { themeId: "" }, { themeId: "les-simpson" }])("rejects %o", (query) => {
    expect(adminQuestionListQuerySchema.safeParse(query).success).toBe(false);
  });
});

describe("adminQuestionListResponseSchema", () => {
  it("carries the whole authored Question, staging flag included", () => {
    expect(adminQuestionListResponseSchema.parse([question])).toEqual([question]);
  });

  it("accepts empty alias and misspelling lists", () => {
    const bare = { ...question, aliases: [], misspellings: [] };
    expect(adminQuestionListResponseSchema.parse([bare])).toEqual([bare]);
  });

  it("rejects a Question without its staging flag", () => {
    const { readyToBePublished: _dropped, ...unstaged } = question;
    expect(adminQuestionListResponseSchema.safeParse([unstaged]).success).toBe(false);
  });
});
