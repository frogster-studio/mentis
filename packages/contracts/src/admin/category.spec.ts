import { describe, expect, it } from "vitest";
import { adminCategoryListResponseSchema } from "./category";

const category = {
  id: "3f1d0d3a-0000-4000-8000-000000000001",
  name: "Histoire",
  color: "#6d4c41",
  icon: "history-edu",
};

describe("adminCategoryListResponseSchema", () => {
  it("carries the presentation fields curation edits", () => {
    expect(adminCategoryListResponseSchema.parse([category])).toEqual([category]);
  });

  it("keeps the served order", () => {
    const older = { ...category, id: "3f1d0d3a-0000-4000-8000-000000000002" };
    expect(adminCategoryListResponseSchema.parse([category, older]).map((row) => row.id)).toEqual([
      category.id,
      older.id,
    ]);
  });

  it.each(["#6D4C41", "brown", ""])(
    "serves the stored color %s rather than refusing it",
    (color) => {
      expect(adminCategoryListResponseSchema.parse([{ ...category, color }])).toEqual([
        { ...category, color },
      ]);
    },
  );

  it("serves a Category whose icon is blank", () => {
    expect(adminCategoryListResponseSchema.parse([{ ...category, icon: "" }])).toEqual([
      { ...category, icon: "" },
    ]);
  });

  it("rejects a slug where a uuid belongs", () => {
    expect(
      adminCategoryListResponseSchema.safeParse([{ ...category, id: "histoire" }]).success,
    ).toBe(false);
  });
});
