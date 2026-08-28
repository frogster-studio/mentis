import { describe, expect, it } from "vitest";
import {
  adminQuestionListQuerySchema,
  adminQuestionListResponseSchema,
  adminQuestionStagingSchema,
  adminQuestionWriteSchema,
} from "./question";

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

  // The seeded Catalog holds ids outside RFC 9562, so serving them must never be a parse error.
  it("serves an id whose version and variant bits are not RFC 9562", () => {
    const seeded = { ...question, id: "f78be0eb-2e1c-8fb4-38fc-04e2b3ac6ec5" };
    expect(adminQuestionListResponseSchema.parse([seeded])).toEqual([seeded]);
  });
});

const write = {
  themeId: THEME_ID,
  text: "Quelle est la capitale de l'Australie ?",
  answer: "Canberra",
  wrongChoices: ["Sydney", "Melbourne", "Perth"],
  aliases: ["Canbera City"],
  misspellings: ["Camberra"],
};

describe("adminQuestionWriteSchema", () => {
  it("keeps the authored Question as the Editor typed it, trimmed", () => {
    expect(adminQuestionWriteSchema.parse({ ...write, text: "  Un titre  " })).toEqual({
      ...write,
      text: "Un titre",
      aliases: ["canbera city"],
      misspellings: ["camberra"],
    });
  });

  it("lowercases aliases and misspellings, dropping blanks and repeats", () => {
    const parsed = adminQuestionWriteSchema.parse({
      ...write,
      aliases: ["Canbera City", " canbera city ", "  "],
      misspellings: ["CAMBERRA"],
    });
    expect(parsed.aliases).toEqual(["canbera city"]);
    expect(parsed.misspellings).toEqual(["camberra"]);
  });

  it.each([
    ["no text", { text: "   " }],
    ["no designated correct answer", { answer: "" }],
    ["three answers only", { wrongChoices: ["Sydney", "Melbourne"] }],
    ["a blank answer slot", { wrongChoices: ["Sydney", "Melbourne", " "] }],
    ["a wrong choice repeating the correct one", { wrongChoices: ["Sydney", "canberra", "Perth"] }],
    ["no Theme", { themeId: "les-simpson" }],
  ])("refuses a Question with %s", (_case, incomplete) => {
    expect(adminQuestionWriteSchema.safeParse({ ...write, ...incomplete }).success).toBe(false);
  });
});

describe("adminQuestionStagingSchema", () => {
  it("carries the flag alone", () => {
    expect(adminQuestionStagingSchema.parse({ readyToBePublished: true })).toEqual({
      readyToBePublished: true,
    });
  });

  it("ignores the authoring fields staging never touches", () => {
    expect(adminQuestionStagingSchema.parse({ readyToBePublished: false, ...write })).toEqual({
      readyToBePublished: false,
    });
  });

  it.each([{}, { readyToBePublished: "true" }, { readyToBePublished: null }])(
    "rejects %o",
    (staging) => {
      expect(adminQuestionStagingSchema.safeParse(staging).success).toBe(false);
    },
  );
});
