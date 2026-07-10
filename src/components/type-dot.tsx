import type { CardType } from "@/lib/cards/schema";
import { cn } from "@/lib/utils";

// Per-type dot color (docs/ui-conventions.md, Card Type colors). Written as
// literal classes so Tailwind's scanner emits them; the hexes live once in
// globals.css as the --type-* variables.
const TYPE_DOT_COLOR: Record<CardType, string> = {
  quiz: "bg-type-quiz",
  "true-false": "bg-type-true-false",
  anecdote: "bg-type-anecdote",
  "did-you-know": "bg-type-did-you-know",
  riddle: "bg-type-riddle",
};

// The shared Card Type "dot" mark: pill-round, type-colored, with a faint inset
// ring so pale colors keep an edge on white. 10px (size-2.5) suits the two type
// Selects and their triggers. Decorative — the label always names the type.
export function TypeDot({
  type,
  className,
}: {
  type: CardType;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2.5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]",
        TYPE_DOT_COLOR[type],
        className,
      )}
    />
  );
}
