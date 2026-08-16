import type { CardType } from "@mentis/contracts/admin";
import { cn } from "@/lib/utils";

// Written as literal classes so Tailwind's scanner emits them.
const TYPE_DOT_COLOR: Record<CardType, string> = {
  quiz: "bg-type-quiz",
  "true-false": "bg-type-true-false",
  anecdote: "bg-type-anecdote",
  "did-you-know": "bg-type-did-you-know",
  riddle: "bg-type-riddle",
};

// The faint inset ring keeps pale type colors visible on white.
export function TypeDot({ type, className }: { type: CardType; className?: string }) {
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
