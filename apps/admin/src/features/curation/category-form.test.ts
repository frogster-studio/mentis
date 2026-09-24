import { describe, expect, it } from "vitest";

import {
  blankCategoryForm,
  categoryDeleteBlocker,
  categoryPayloadOf,
  isCategoryFormDirty,
  isServableColor,
  toCategoryForm,
} from "./category-form";

const category = {
  id: "3f1d0d3a-0000-4000-8000-000000000001",
  name: "Histoire",
  color: "#6d4c41",
  secondaryColor: "#fff6e2",
  icon: "history-edu",
};

describe("toCategoryForm", () => {
  it("loads the stored presentation", () => {
    expect(toCategoryForm(category)).toEqual({
      name: "Histoire",
      color: "#6d4c41",
      secondaryColor: "#fff6e2",
      icon: "history-edu",
    });
  });

  it("lowercases a hex the app would still paint", () => {
    expect(toCategoryForm({ ...category, color: "#6D4C41" }).color).toBe("#6d4c41");
  });

  it("lowercases the secondary color the same as the color", () => {
    expect(toCategoryForm({ ...category, secondaryColor: "#FFF6E2" }).secondaryColor).toBe(
      "#fff6e2",
    );
  });

  it("keeps a color it cannot serve rather than substituting one", () => {
    expect(toCategoryForm({ ...category, color: "brown" }).color).toBe("brown");
  });
});

describe("isServableColor", () => {
  it.each(["#6d4c41", "#0ea5e9"])("accepts %o", (color) => {
    expect(isServableColor(color)).toBe(true);
  });

  it.each(["#6D4C41", "brown", "#abc", ""])("refuses %o", (color) => {
    expect(isServableColor(color)).toBe(false);
  });
});

describe("blankCategoryForm", () => {
  it("starts a new Category on white, the same default the column backfilled", () => {
    expect(blankCategoryForm().secondaryColor).toBe("#ffffff");
  });
});

describe("categoryPayloadOf", () => {
  it("sends the trimmed presentation once name, both colors and icon are there", () => {
    expect(
      categoryPayloadOf({
        name: "  Histoire  ",
        color: "#6d4c41",
        secondaryColor: "#fff6e2",
        icon: "history-edu",
      }),
    ).toEqual({
      name: "Histoire",
      color: "#6d4c41",
      secondaryColor: "#fff6e2",
      icon: "history-edu",
    });
  });

  it("refuses a blank form", () => {
    expect(categoryPayloadOf(blankCategoryForm())).toBeNull();
  });

  it("refuses an icon no glyph answers to", () => {
    expect(categoryPayloadOf({ ...category, icon: "histori-edu" })).toBeNull();
  });

  it("refuses a color the app could not paint", () => {
    expect(categoryPayloadOf({ ...category, color: "#6D4C41" })).toBeNull();
  });

  it("refuses a secondary color the app could not paint", () => {
    expect(categoryPayloadOf({ ...category, secondaryColor: "#FFF6E2" })).toBeNull();
  });
});

describe("isCategoryFormDirty", () => {
  it("stays clean until a field moves", () => {
    const saved = toCategoryForm(category);
    expect(isCategoryFormDirty({ ...saved }, saved)).toBe(false);
    expect(isCategoryFormDirty({ ...saved, icon: "movie" }, saved)).toBe(true);
    expect(isCategoryFormDirty({ ...saved, secondaryColor: "#e0f2f1" }, saved)).toBe(true);
  });
});

describe("categoryDeleteBlocker", () => {
  it("lets an empty Category go", () => {
    expect(categoryDeleteBlocker(0)).toBeNull();
  });

  it("holds back a Category whose Themes are still loading", () => {
    expect(categoryDeleteBlocker(null)).toBe("Still counting this Category's Themes.");
  });

  it.each([
    [1, "Holds 1 Theme — move or delete them first."],
    [3, "Holds 3 Themes — move or delete them first."],
  ])("holds back a Category with %i Themes", (themeCount, hint) => {
    expect(categoryDeleteBlocker(themeCount)).toBe(hint);
  });
});
