import { describe, expect, it } from "vitest";

import { findQueryWords, readQueryWords } from "./search-words";

const BAYARD = "Quel chevalier français était surnommé « sans peur et sans reproche » ?";
const HOMMES = "Quels sont les Hommes Francais qui détruisent…";

function finds(query: string, text: string): boolean {
  const queryWords = readQueryWords(query);
  return (
    queryWords.length > 0 &&
    findQueryWords(queryWords, text).every((wordFinds) => wordFinds.length > 0)
  );
}

function foundSpellings(query: string, text: string): string[][] {
  return findQueryWords(readQueryWords(query), text).map((wordFinds) =>
    wordFinds.map(({ start, end }) => text.slice(start, end)),
  );
}

describe("readQueryWords", () => {
  it("folds case, accents and ligatures", () => {
    expect(readQueryWords("Français CŒUR Ætna")).toEqual(["francais", "coeur", "aetna"]);
  });

  it("splits on every character that is not a letter or a digit", () => {
    expect(readQueryWords("l'Everest Saint-Exupéry 1515")).toEqual([
      "l",
      "everest",
      "saint",
      "exupery",
      "1515",
    ]);
  });

  it("yields no word for punctuation or blanks", () => {
    expect(readQueryWords("?")).toEqual([]);
    expect(readQueryWords("   ")).toEqual([]);
  });
});

describe("findQueryWords", () => {
  it.each(["che", "francais", "quel", "chevalier francais"])("finds Bayard with %j", (query) => {
    expect(finds(query, BAYARD)).toBe(true);
  });

  it.each(["homme fr", "francais detrui"])("finds the Hommes with %j", (query) => {
    expect(finds(query, HOMMES)).toBe(true);
  });

  it("needs every query word, and does not stem", () => {
    expect(finds("francais détruire", HOMMES)).toBe(false);
  });

  it("drops a final s on either side", () => {
    expect(finds("hommes", "Un homme")).toBe(true);
    expect(finds("quels", "Quel roi ?")).toBe(true);
  });

  it("finds across ligatures, apostrophes and hyphens", () => {
    expect(finds("coeur", "Le cœur a ses raisons")).toBe(true);
    expect(finds("everest", "Qui a gravi l'Everest ?")).toBe(true);
    expect(finds("exu", "Antoine de Saint-Exupéry")).toBe(true);
  });

  it("never finds inside a word", () => {
    expect(finds("bus", "Le bureau")).toBe(false);
    expect(finds("saintex", "Antoine de Saint-Exupéry")).toBe(false);
  });

  it("carries each found word's span in its original spelling", () => {
    expect(foundSpellings("francais", BAYARD)).toEqual([["français"]]);
    expect(foundSpellings("exu", "Antoine de Saint-Exupéry")).toEqual([["Exupéry"]]);
    expect(foundSpellings("cafe", "Un café noir")).toEqual([["café"]]);
  });

  it("lists every word a query word finds", () => {
    expect(foundSpellings("sans", BAYARD)).toEqual([["sans", "sans"]]);
  });

  it("tells a whole find from a start", () => {
    const wholeness = (query: string) =>
      findQueryWords(readQueryWords(query), HOMMES).map((wordFinds) =>
        wordFinds.map(({ whole }) => whole),
      );
    expect(wholeness("detrui")).toEqual([[false]]);
    expect(wholeness("francais")).toEqual([[true]]);
    expect(wholeness("homme")).toEqual([[true]]);
  });
});
