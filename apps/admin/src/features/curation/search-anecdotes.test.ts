import { describe, expect, it } from "vitest";

import { searchAnecdotes } from "./search-anecdotes";
import type { Anecdote } from "./types";

const anecdote = (id: string, text: string): Anecdote => ({ id, text, imageUrl: null });

const FOURNAISE = anecdote(
  "7b4e0d3a-0000-4000-8000-000000000001",
  "Le **Piton de la Fournaise** entre en éruption __presque chaque année__.",
);
const FLAMBOYANT = anecdote(
  "7b4e0d3a-0000-4000-8000-000000000002",
  "À La Réunion, le **flamboyant** fleurit en décembre.",
);
const ANECDOTES = [FOURNAISE, FLAMBOYANT];

const foundIds = (query: string) =>
  searchAnecdotes(query, ANECDOTES).map((found) => found.anecdote.id);

describe("searchAnecdotes", () => {
  it.each(["", "   ", "?"])(
    "keeps every Anecdote in its order for the wordless query %j",
    (query) => {
      expect(searchAnecdotes(query, ANECDOTES)).toEqual([
        { anecdote: FOURNAISE, textHighlights: [] },
        { anecdote: FLAMBOYANT, textHighlights: [] },
      ]);
    },
  );

  it("finds a word whatever its case and accents, by its beginning", () => {
    expect(foundIds("ERUPT")).toEqual([FOURNAISE.id]);
    expect(foundIds("reunion")).toEqual([FLAMBOYANT.id]);
  });

  it("requires every query word", () => {
    expect(foundIds("piton fournaise")).toEqual([FOURNAISE.id]);
    expect(foundIds("piton flamboyant")).toEqual([]);
  });

  it("finds a word held between emphasis markers and highlights it without them", () => {
    const [found] = searchAnecdotes("fournaise annee", ANECDOTES);

    expect(
      found.textHighlights.map(({ start, end }) => found.anecdote.text.slice(start, end)),
    ).toEqual(["Fournaise", "année"]);
  });
});
