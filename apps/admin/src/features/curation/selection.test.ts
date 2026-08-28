import type { AdminCategoryListResponse, AdminThemeListResponse } from "@mentis/contracts/admin";
import { describe, expect, it } from "vitest";

import {
  NO_SELECTION,
  readSelection,
  resolveSelection,
  selectCategory,
  selectionQuery,
  selectQuestion,
  selectTheme,
  visibleCategoryIds,
} from "./selection";

const TELEVISION = "3f1d0d3a-0000-4000-8000-000000000001";
const HISTOIRE = "3f1d0d3a-0000-4000-8000-000000000002";
const SIMPSON = "5c2e0d3a-0000-4000-8000-000000000001";
const BROUILLON = "5c2e0d3a-0000-4000-8000-000000000002";
const QUESTION = "7a3f0d3a-0000-4000-8000-000000000001";

const categories: AdminCategoryListResponse = [
  { id: TELEVISION, name: "Télévision", color: "#8e24aa", icon: "tv" },
  { id: HISTOIRE, name: "Histoire", color: "#6d4c41", icon: "history-edu" },
];

const themes: AdminThemeListResponse = [
  {
    id: SIMPSON,
    name: "Les Simpson",
    categoryId: TELEVISION,
    image: "les-simpson.webp",
    published: true,
    questionCount: 24,
    readyQuestionCount: 21,
  },
  {
    id: BROUILLON,
    name: "Brouillon",
    categoryId: HISTOIRE,
    image: "brouillon.webp",
    published: false,
    questionCount: 3,
    readyQuestionCount: 0,
  },
];

describe("readSelection", () => {
  it("reads the three levels off the query string", () => {
    const params = new URLSearchParams(
      `category=${TELEVISION}&theme=${SIMPSON}&question=${QUESTION}`,
    );
    expect(readSelection(params)).toEqual({
      categoryId: TELEVISION,
      themeId: SIMPSON,
      questionId: QUESTION,
    });
  });

  it("reads a blank param as no selection", () => {
    expect(readSelection(new URLSearchParams("category="))).toEqual(NO_SELECTION);
  });
});

describe("selectionQuery", () => {
  it("round-trips a selection through the query string", () => {
    const selection = { categoryId: TELEVISION, themeId: SIMPSON, questionId: QUESTION };
    expect(readSelection(new URLSearchParams(selectionQuery(selection)))).toEqual(selection);
  });

  it("serializes an empty selection to no query string at all", () => {
    expect(selectionQuery(NO_SELECTION)).toBe("");
  });
});

describe("selecting a level", () => {
  it("clears the levels below a Category", () => {
    expect(selectCategory(HISTOIRE)).toEqual({
      categoryId: HISTOIRE,
      themeId: null,
      questionId: null,
    });
  });

  it("clears the Question when the Theme changes", () => {
    const selection = { categoryId: TELEVISION, themeId: SIMPSON, questionId: QUESTION };
    expect(selectTheme(selection, BROUILLON).questionId).toBeNull();
  });

  it("keeps the ancestors when a Question is picked", () => {
    const selection = { categoryId: TELEVISION, themeId: SIMPSON, questionId: null };
    expect(selectQuestion(selection, QUESTION)).toEqual({
      categoryId: TELEVISION,
      themeId: SIMPSON,
      questionId: QUESTION,
    });
  });
});

describe("resolveSelection", () => {
  it("keeps a selection whose rows all exist", () => {
    const selection = { categoryId: TELEVISION, themeId: SIMPSON, questionId: QUESTION };
    expect(resolveSelection(selection, { categories, themes })).toEqual(selection);
  });

  it("drops everything when the Category is gone", () => {
    const selection = { categoryId: "missing", themeId: SIMPSON, questionId: QUESTION };
    expect(resolveSelection(selection, { categories, themes })).toEqual(NO_SELECTION);
  });

  it("drops the Theme and Question when the Theme belongs to another Category", () => {
    const selection = { categoryId: TELEVISION, themeId: BROUILLON, questionId: QUESTION };
    expect(resolveSelection(selection, { categories, themes })).toEqual({
      categoryId: TELEVISION,
      themeId: null,
      questionId: null,
    });
  });

  it("prunes nothing while the catalog is still loading", () => {
    const selection = { categoryId: "missing", themeId: SIMPSON, questionId: QUESTION };
    expect(resolveSelection(selection, {})).toEqual(selection);
  });
});

describe("visibleCategoryIds", () => {
  it("holds only the Categories with at least one Published Theme", () => {
    expect(visibleCategoryIds(themes)).toEqual(new Set([TELEVISION]));
  });
});
