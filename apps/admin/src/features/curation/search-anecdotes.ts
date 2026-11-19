import { type Highlight, highlights } from "./search-catalog";
import { findQueryWords, readQueryWords } from "./search-words";
import type { Anecdote } from "./types";

export type FoundAnecdote = { anecdote: Anecdote; textHighlights: Highlight[] };

// A query holding no word filters nothing, so the list stays whole and in its stored order.
export function searchAnecdotes(query: string, anecdotes: Anecdote[]): FoundAnecdote[] {
  const queryWords = readQueryWords(query);
  return anecdotes.flatMap((anecdote) => {
    const textFinds = findQueryWords(queryWords, anecdote.text);
    if (textFinds.some((wordFinds) => wordFinds.length === 0)) return [];
    return [{ anecdote, textHighlights: highlights(textFinds) }];
  });
}
