import { anecdoteSegments } from "../anecdote-segments";
import type { Highlight } from "../search-catalog";

interface AnecdoteTextProps {
  text: string;
  highlights?: Highlight[];
}

export const AnecdoteText = ({ text, highlights = [] }: AnecdoteTextProps) => {
  let offset = 0;
  return anecdoteSegments(text, highlights).map((segment) => {
    const key = offset;
    offset += segment.text.length;
    return (
      <span
        key={key}
        className={`${segment.isBold ? "font-bold" : ""} ${segment.isItalic ? "italic" : ""} ${
          segment.isFound ? "bg-sky-100 text-sky-700" : ""
        }`}
      >
        {segment.text}
      </span>
    );
  });
};
