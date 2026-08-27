import { describe, expect, it } from "vitest";
import { appCategorySchema, appThemeListResponseSchema } from "./theme";

const category = { id: "nature", name: "Nature", color: "#2e7d32", icon: "park" };

const theme = {
  id: "chocolats",
  name: "Chocolats",
  imageUrl: "https://cdn.example.com/storage/v1/object/public/theme-images/chocolats.webp",
  questionCount: 12,
  category,
};

describe("appCategorySchema", () => {
  it("accepts a lowercase six-digit hex color", () => {
    expect(appCategorySchema.parse(category)).toEqual(category);
  });

  it.each(["#2E7D32", "#2e7d3", "#2e7d322", "2e7d32", "rebeccapurple", ""])(
    "rejects the color %s",
    (color) => {
      expect(appCategorySchema.safeParse({ ...category, color }).success).toBe(false);
    },
  );

  it("rejects a blank icon", () => {
    expect(appCategorySchema.safeParse({ ...category, icon: "" }).success).toBe(false);
  });
});

describe("appThemeListResponseSchema", () => {
  it("carries the image URL and the embedded Category", () => {
    expect(appThemeListResponseSchema.parse([theme])).toEqual([theme]);
  });

  it("rejects a theme without its Category", () => {
    const { category: _dropped, ...withoutCategory } = theme;
    expect(appThemeListResponseSchema.safeParse([withoutCategory]).success).toBe(false);
  });

  it("rejects an image path where a full URL belongs", () => {
    expect(
      appThemeListResponseSchema.safeParse([{ ...theme, imageUrl: "chocolats.webp" }]).success,
    ).toBe(false);
  });
});
