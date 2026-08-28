import { describe, expect, it } from "vitest";
import { adminThemeListResponseSchema } from "./theme";

const theme = {
  id: "5c2e0d3a-0000-4000-8000-000000000001",
  name: "Les Simpson",
  categoryId: "3f1d0d3a-0000-4000-8000-000000000001",
  image: "les-simpson.webp",
  published: true,
  questionCount: 24,
  readyQuestionCount: 20,
};

describe("adminThemeListResponseSchema", () => {
  it("carries the staging flag and both Question counts", () => {
    expect(adminThemeListResponseSchema.parse([theme])).toEqual([theme]);
  });

  it("accepts a Theme no Question hangs under", () => {
    const empty = { ...theme, questionCount: 0, readyQuestionCount: 0 };
    expect(adminThemeListResponseSchema.parse([empty])).toEqual([empty]);
  });

  it.each(["questionCount", "readyQuestionCount"] as const)("rejects a negative %s", (field) => {
    expect(adminThemeListResponseSchema.safeParse([{ ...theme, [field]: -1 }]).success).toBe(false);
  });

  it("rejects a Theme without its Category", () => {
    const { categoryId: _dropped, ...orphan } = theme;
    expect(adminThemeListResponseSchema.safeParse([orphan]).success).toBe(false);
  });
});
