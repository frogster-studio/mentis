import GLYPHMAP from "@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialIcons.json";
import { describe, expect, it } from "vitest";

import { iconGlyph, isIconName, suggestIcons } from "./icons";

const EVERY_ICON_NAME = Object.keys(GLYPHMAP);

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

  // The field opens its grid on focus, so an untouched icon offers the whole glyph set to browse.
  it("offers every glyph before a character is typed", () => {
    expect(suggestIcons("")).toHaveLength(EVERY_ICON_NAME.length);
    expect(suggestIcons("").every(isIconName)).toBe(true);
  });

  it("keeps every name carrying what was typed, past the eight the field used to show", () => {
    const matches = suggestIcons("restaurant");
    expect(matches[0]).toBe("restaurant");
    expect(matches).toEqual(
      expect.arrayContaining(EVERY_ICON_NAME.filter((name) => name.includes("restaurant"))),
    );
    expect(matches).toHaveLength(
      EVERY_ICON_NAME.filter((name) => name.includes("restaurant")).length,
    );
  });

  it("still ranks a prefix before a longer name that only carries the query", () => {
    const matches = suggestIcons("movie");
    expect(matches.indexOf("movie")).toBeLessThan(matches.indexOf("local-movies"));
    expect(matches.indexOf("movie-filter")).toBeLessThan(matches.indexOf("movie-creation"));
  });

  it("suggests nothing for a name no glyph carries", () => {
    expect(suggestIcons("zzzzzz")).toEqual([]);
  });
});
