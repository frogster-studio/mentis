export type AnecdoteTextSegment = {
  text: string;
  emphasis: "regular" | "bold" | "italic";
};

// A span closes on its own marker only, so the other marker inside it and an orphan stay literal.
const EMPHASIS_SPAN = /(\*\*|__)([\s\S]+?)\1/g;

export function anecdoteTextSegments(text: string): AnecdoteTextSegment[] {
  const segments: AnecdoteTextSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(EMPHASIS_SPAN)) {
    const [span, marker, content] = match;
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), emphasis: "regular" });
    }
    segments.push({ text: content, emphasis: marker === "**" ? "bold" : "italic" });
    cursor = match.index + span.length;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), emphasis: "regular" });
  }
  return segments;
}
