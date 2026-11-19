import type { Highlight } from "./search-catalog";

export type AnecdoteSegment = {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  isFound: boolean;
};

type Span = { start: number; end: number; isBold: boolean; isItalic: boolean };

// The app closes a span on its own marker only, so the other marker inside it and an orphan stay literal.
const EMPHASIS_SPAN = /(\*\*|__)([\s\S]+?)\1/g;

function emphasisSpans(text: string): Span[] {
  const spans: Span[] = [];
  let cursor = 0;
  for (const match of text.matchAll(EMPHASIS_SPAN)) {
    const [span, marker] = match;
    if (match.index > cursor) {
      spans.push({ start: cursor, end: match.index, isBold: false, isItalic: false });
    }
    spans.push({
      start: match.index + marker.length,
      end: match.index + span.length - marker.length,
      isBold: marker === "**",
      isItalic: marker === "__",
    });
    cursor = match.index + span.length;
  }
  if (cursor < text.length) {
    spans.push({ start: cursor, end: text.length, isBold: false, isItalic: false });
  }
  return spans;
}

// Highlights index the stored text, markers included, and must come sorted and disjoint.
export function anecdoteSegments(text: string, highlights: Highlight[]): AnecdoteSegment[] {
  return emphasisSpans(text).flatMap(({ start, end, isBold, isItalic }) => {
    const segments: AnecdoteSegment[] = [];
    const cut = (from: number, to: number, isFound: boolean) => {
      if (to > from) segments.push({ text: text.slice(from, to), isBold, isItalic, isFound });
    };
    let cursor = start;
    for (const highlight of highlights) {
      const foundFrom = Math.max(highlight.start, cursor);
      const foundTo = Math.min(highlight.end, end);
      if (foundTo <= foundFrom) continue;
      cut(cursor, foundFrom, false);
      cut(foundFrom, foundTo, true);
      cursor = foundTo;
    }
    cut(cursor, end, false);
    return segments;
  });
}
