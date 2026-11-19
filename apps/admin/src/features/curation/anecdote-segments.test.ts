import { describe, expect, it } from "vitest";

import { type AnecdoteSegment, anecdoteSegments } from "./anecdote-segments";

const regular = (text: string): AnecdoteSegment => ({
  text,
  isBold: false,
  isItalic: false,
  isFound: false,
});
const bold = (text: string): AnecdoteSegment => ({ ...regular(text), isBold: true });
const italic = (text: string): AnecdoteSegment => ({ ...regular(text), isItalic: true });
const found = (segment: AnecdoteSegment): AnecdoteSegment => ({ ...segment, isFound: true });

const highlightOf = (text: string, word: string) => {
  const start = text.indexOf(word);
  return { start, end: start + word.length };
};

describe("anecdoteSegments", () => {
  it("splits bold and italic spans from the regular text, in order, markers removed", () => {
    expect(anecdoteSegments("Le **miel** ne se __périme__ jamais.", [])).toEqual([
      regular("Le "),
      bold("miel"),
      regular(" ne se "),
      italic("périme"),
      regular(" jamais."),
    ]);
  });

  it("gives one regular segment to a text without markers", () => {
    expect(anecdoteSegments("Les loutres se tiennent la main.", [])).toEqual([
      regular("Les loutres se tiennent la main."),
    ]);
  });

  it("shows an orphan marker literally", () => {
    expect(anecdoteSegments("2 ** 3 vaut 8", [])).toEqual([regular("2 ** 3 vaut 8")]);
    expect(anecdoteSegments("__init__ et un __ seul", [])).toEqual([
      italic("init"),
      regular(" et un __ seul"),
    ]);
  });

  it("shows the other marker literally inside a span", () => {
    expect(anecdoteSegments("**un __gras__ entier**", [])).toEqual([bold("un __gras__ entier")]);
  });

  it("cuts a found word out of the regular text around it", () => {
    const text = "Les loutres se tiennent la main.";

    expect(anecdoteSegments(text, [highlightOf(text, "loutres")])).toEqual([
      regular("Les "),
      found(regular("loutres")),
      regular(" se tiennent la main."),
    ]);
  });

  it("keeps a found word's emphasis, its offsets counted on the stored text", () => {
    const text = "Le **Piton de la Fournaise** entre en __éruption__.";

    expect(
      anecdoteSegments(text, [highlightOf(text, "Fournaise"), highlightOf(text, "éruption")]),
    ).toEqual([
      regular("Le "),
      bold("Piton de la "),
      found(bold("Fournaise")),
      regular(" entre en "),
      found(italic("éruption")),
      regular("."),
    ]);
  });
});
