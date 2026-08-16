"use client";

import { SOCIALS, type Social } from "@mentis/contracts/admin";
import { startTransition, useOptimistic } from "react";

import { SOCIAL_ICONS } from "@/components/social-icons";
import { Button } from "@/components/ui/button";
import { setCardPosted } from "@/lib/cards/actions";
import { SOCIAL_LABELS } from "@/lib/cards/labels";

// Clicks are optimistic: the icon flips immediately and the revert is the error signal.
export function CardSocials({ cardId, postedOn }: { cardId: string; postedOn: Social[] }) {
  const [optimisticPostedOn, applyNextMarks] = useOptimistic(
    postedOn,
    (_current: Social[], next: Social[]) => next,
  );

  function toggle(social: Social) {
    const posted = !optimisticPostedOn.includes(social);
    // Sending the whole next set keeps a double-fired click from undoing itself.
    const next = posted
      ? SOCIALS.filter((mark) => mark === social || optimisticPostedOn.includes(mark))
      : optimisticPostedOn.filter((mark) => mark !== social);
    startTransition(async () => {
      applyNextMarks(next);
      try {
        await setCardPosted(cardId, next);
      } catch {
        // The optimistic marks roll back to the server state by themselves.
      }
    });
  }

  return (
    // z-10 lifts the toggles above the row-covering link overlay, like the Tag chips.
    <div className="relative z-10 flex items-center">
      {SOCIALS.map((social) => {
        const Icon = SOCIAL_ICONS[social];
        const posted = optimisticPostedOn.includes(social);
        return (
          <Button
            key={social}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-pressed={posted}
            aria-label={`Posted on ${SOCIAL_LABELS[social]}`}
            title={SOCIAL_LABELS[social]}
            onClick={() => toggle(social)}
            className={
              posted
                ? "bg-sky-100 text-sky-600 hover:bg-sky-100 hover:text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 dark:hover:bg-sky-500/15 dark:hover:text-sky-300"
                : "text-muted-foreground"
            }
          >
            <Icon />
          </Button>
        );
      })}
    </div>
  );
}
