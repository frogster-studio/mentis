import { describe, expect, it } from "vitest";

import { iconGlyph, isIconName, suggestIcons } from "./icons";

describe("isIconName", () => {
  it.each(["history-edu", "tv", "movie"])("knows %o, a name the Catalog already stores", (name) => {
    expect(isIconName(name)).toBe(true);
  });

  it("refuses a typo", () => {
    expect(isIconName("histori-edu")).toBe(false);
  });
});

describe("iconGlyph", () => {
  it("paints a known name", () => {
    expect(iconGlyph("history-edu")).toHaveLength(1);
  });

  it("paints nothing at all for a typo", () => {
    expect(iconGlyph("histori-edu")).toBe("");
  });
});

describe("suggestIcons", () => {
  it("puts the names starting with what was typed first", () => {
    expect(suggestIcons("movie")[0]).toBe("movie");
    expect(suggestIcons("MOVIE ")[0]).toBe("movie");
  });

  // The field opens its list on focus, so an untouched icon still has names to browse.
  it("offers a starting list before a character is typed", () => {
    expect(suggestIcons("").length).toBeGreaterThan(0);
    expect(suggestIcons("").every(isIconName)).toBe(true);
  });

  it("suggests nothing for a name no glyph carries", () => {
    expect(suggestIcons("zzzzzz")).toEqual([]);
  });
});
