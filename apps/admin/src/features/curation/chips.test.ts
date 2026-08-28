import { describe, expect, it } from "vitest";

import { formatChips, parseChips } from "./chips";

describe("parseChips", () => {
  it("splits one input on commas", () => {
    expect(parseChips("canberra, canbera city")).toEqual(["canberra", "canbera city"]);
  });

  it("lowercases whatever was typed, so Answer Matching sees a normalized list", () => {
    expect(parseChips("Canbera City, CAMBERRA")).toEqual(["canbera city", "camberra"]);
  });

  it("drops blanks, stray separators and repeats", () => {
    expect(parseChips(" , camberra ,, camberra , ")).toEqual(["camberra"]);
  });

  it("holds no chip at all for an empty input", () => {
    expect(parseChips("")).toEqual([]);
  });
});

describe("formatChips", () => {
  it("renders a stored list back into its input", () => {
    expect(formatChips(["canberra", "canbera city"])).toBe("canberra, canbera city");
  });

  it("round-trips through parseChips", () => {
    expect(parseChips(formatChips(["canberra", "canbera city"]))).toEqual([
      "canberra",
      "canbera city",
    ]);
  });
});
