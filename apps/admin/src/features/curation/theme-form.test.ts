import { describe, expect, it } from "vitest";

import {
  blankThemeForm,
  isThemeFormDirty,
  themeDeleteBlocker,
  themeDeleteConfirmation,
  themePayloadOf,
  toThemeForm,
} from "./theme-form";

const CATEGORY_ID = "3f1d0d3a-0000-4000-8000-000000000001";

const theme = {
  id: "5c2e0d3a-0000-4000-8000-000000000001",
  name: "Les Simpson",
  categoryId: CATEGORY_ID,
  image: "les-simpson.webp",
  published: false,
  questionCount: 24,
  readyQuestionCount: 20,
};

describe("blankThemeForm", () => {
  it("starts under the Category the columns are showing", () => {
    expect(blankThemeForm(CATEGORY_ID)).toEqual({ name: "", categoryId: CATEGORY_ID, image: "" });
  });

  it("starts Categoryless when nothing is selected", () => {
    expect(blankThemeForm(null).categoryId).toBe("");
  });
});

describe("toThemeForm", () => {
  it("loads the authored fields and nothing staging owns", () => {
    expect(toThemeForm(theme)).toEqual({
      name: "Les Simpson",
      categoryId: CATEGORY_ID,
      image: "les-simpson.webp",
    });
  });
});

describe("themePayloadOf", () => {
  it("sends the trimmed Theme once name, Category and image are there", () => {
    expect(
      themePayloadOf({ name: "  Les Simpson  ", categoryId: CATEGORY_ID, image: "a.webp" }),
    ).toEqual({ name: "Les Simpson", categoryId: CATEGORY_ID, image: "a.webp" });
  });

  it("refuses a blank form", () => {
    expect(themePayloadOf(blankThemeForm(null))).toBeNull();
  });

  it("refuses a Theme no Category holds", () => {
    expect(themePayloadOf({ ...toThemeForm(theme), categoryId: "" })).toBeNull();
  });

  it("refuses a Theme with no image path", () => {
    expect(themePayloadOf({ ...toThemeForm(theme), image: "  " })).toBeNull();
  });
});

describe("isThemeFormDirty", () => {
  it("stays clean until a field moves", () => {
    const saved = toThemeForm(theme);
    expect(isThemeFormDirty({ ...saved }, saved)).toBe(false);
    expect(isThemeFormDirty({ ...saved, categoryId: "moved" }, saved)).toBe(true);
  });
});

describe("themeDeleteBlocker", () => {
  it("lets an unpublished Theme go", () => {
    expect(themeDeleteBlocker(false)).toBeNull();
  });

  it("holds back a Theme players are being served", () => {
    expect(themeDeleteBlocker(true)).toBe("Published — unpublish the Theme first.");
  });
});

describe("themeDeleteConfirmation", () => {
  it.each([
    [0, "Delete this Theme for good? It holds no Question."],
    [1, "Delete this Theme for good? Its 1 Question will be deleted with it."],
    [24, "Delete this Theme for good? Its 24 Questions will be deleted with it."],
  ])("states the cascade of %i Questions", (questionCount, confirmation) => {
    expect(themeDeleteConfirmation(questionCount)).toBe(confirmation);
  });
});
