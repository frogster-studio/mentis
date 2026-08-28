import { describe, expect, it } from "vitest";
import {
  adminThemeListResponseSchema,
  adminThemeResponseSchema,
  adminThemeStagingSchema,
  adminThemeWriteSchema,
} from "./theme";

const CATEGORY_ID = "3f1d0d3a-0000-4000-8000-000000000001";

const theme = {
  id: "5c2e0d3a-0000-4000-8000-000000000001",
  name: "Les Simpson",
  categoryId: CATEGORY_ID,
  image: "les-simpson.webp",
  published: true,
};

const listed = { ...theme, questionCount: 24, readyQuestionCount: 20 };

describe("adminThemeResponseSchema", () => {
  it("carries the staging flag and the stored image path", () => {
    expect(adminThemeResponseSchema.parse(theme)).toEqual(theme);
  });

  it("holds back the slug a write never authored", () => {
    expect(adminThemeResponseSchema.parse({ ...theme, slug: "les-simpson" })).toEqual(theme);
  });
});

describe("adminThemeListResponseSchema", () => {
  it("carries the staging flag and both Question counts", () => {
    expect(adminThemeListResponseSchema.parse([listed])).toEqual([listed]);
  });

  it("accepts a Theme no Question hangs under", () => {
    const empty = { ...listed, questionCount: 0, readyQuestionCount: 0 };
    expect(adminThemeListResponseSchema.parse([empty])).toEqual([empty]);
  });

  it.each(["questionCount", "readyQuestionCount"] as const)("rejects a negative %s", (field) => {
    expect(adminThemeListResponseSchema.safeParse([{ ...listed, [field]: -1 }]).success).toBe(
      false,
    );
  });

  it("rejects a Theme without its Category", () => {
    const { categoryId: _dropped, ...orphan } = listed;
    expect(adminThemeListResponseSchema.safeParse([orphan]).success).toBe(false);
  });
});

const write = { name: "Les Simpson", categoryId: CATEGORY_ID, image: "les-simpson.webp" };

describe("adminThemeWriteSchema", () => {
  it("keeps the Theme the Editor authored, trimmed", () => {
    expect(adminThemeWriteSchema.parse({ ...write, name: "  Les Simpson  " })).toEqual(write);
  });

  it("never carries a slug: it is derived from the name, never authored", () => {
    expect(adminThemeWriteSchema.parse({ ...write, slug: "les-simpsons" })).toEqual(write);
  });

  it("never carries Published: staging is a switch of its own, not an authoring field", () => {
    expect(adminThemeWriteSchema.parse({ ...write, published: true })).toEqual(write);
  });

  it.each([
    ["a blank name", { name: "   " }],
    ["a blank image path", { image: "  " }],
    ["no Category", { categoryId: "" }],
    ["a Category slug where a uuid belongs", { categoryId: "television" }],
  ])("refuses a Theme with %s", (_case, incomplete) => {
    expect(adminThemeWriteSchema.safeParse({ ...write, ...incomplete }).success).toBe(false);
  });
});

describe("adminThemeStagingSchema", () => {
  it("carries the switch alone", () => {
    expect(adminThemeStagingSchema.parse({ published: true })).toEqual({ published: true });
  });

  it("ignores the authoring fields staging never touches", () => {
    expect(adminThemeStagingSchema.parse({ published: false, ...write })).toEqual({
      published: false,
    });
  });

  it.each([{}, { published: "true" }, { published: null }])("rejects %o", (staging) => {
    expect(adminThemeStagingSchema.safeParse(staging).success).toBe(false);
  });
});
