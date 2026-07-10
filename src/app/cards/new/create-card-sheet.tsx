"use client";

import { ChevronLeft, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type * as React from "react";
import { startTransition, useActionState } from "react";

import { CardTypeFields } from "@/app/cards/card-type-fields";
import { ImagesField, useCardImages } from "@/app/cards/image-field";
import { TagsField } from "@/app/cards/tags-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { createCard } from "@/lib/cards/actions";
import {
  CARD_TYPE_LABELS,
  CARD_TYPES,
  type CardType,
} from "@/lib/cards/schema";
import { cn } from "@/lib/utils";

export function CreateCardSheet({ selectedType }: { selectedType?: CardType }) {
  const router = useRouter();

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) router.push("/");
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="overflow-y-auto p-0 data-[side=right]:w-1/2 data-[side=right]:sm:max-w-none"
      >
        {selectedType ? (
          <CreateCardForm type={selectedType} />
        ) : (
          <CardTypePicker />
        )}
      </SheetContent>
    </Sheet>
  );
}

// Sticky top bar shared by both the type picker and the form. The form passes
// its Save button as `actions`; the close button is always present.
function CreateCardHeader({
  selectedType,
  actions,
}: {
  selectedType?: CardType;
  actions?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-popover px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <SheetTitle>New Card</SheetTitle>
        <SheetDescription>
          {selectedType
            ? `Write the ${CARD_TYPE_LABELS[selectedType]} content.`
            : "Pick a Card Type to start writing."}
        </SheetDescription>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <SheetClose asChild>
          <Button type="button" variant="ghost" size="icon" aria-label="Close">
            <X />
          </Button>
        </SheetClose>
      </div>
    </div>
  );
}

// Hover-tint + dot color per Card Type (docs/ui-conventions.md, Card Type
// colors). Written as literal classes so Tailwind's scanner emits them.
// Hovering a chip fills it with its own type color at ~10% over white — the one
// sanctioned type-tinted interaction; focus-visible still shows the sky ring.
const CARD_TYPE_CHIP: Record<CardType, { dot: string; hover: string }> = {
  quiz: {
    dot: "bg-type-quiz",
    hover: "hover:bg-[color-mix(in_srgb,var(--type-quiz)_10%,white)]",
  },
  "true-false": {
    dot: "bg-type-true-false",
    hover: "hover:bg-[color-mix(in_srgb,var(--type-true-false)_10%,white)]",
  },
  anecdote: {
    dot: "bg-type-anecdote",
    hover: "hover:bg-[color-mix(in_srgb,var(--type-anecdote)_10%,white)]",
  },
  "did-you-know": {
    dot: "bg-type-did-you-know",
    hover: "hover:bg-[color-mix(in_srgb,var(--type-did-you-know)_10%,white)]",
  },
  riddle: {
    dot: "bg-type-riddle",
    hover: "hover:bg-[color-mix(in_srgb,var(--type-riddle)_10%,white)]",
  },
};

function CardTypePicker() {
  return (
    <div className="flex flex-col">
      <CreateCardHeader />
      <div className="flex flex-wrap gap-2 p-4">
        {CARD_TYPES.map((type) => (
          <Button
            key={type}
            asChild
            variant="outline"
            className={cn("gap-2", CARD_TYPE_CHIP[type].hover)}
          >
            <Link href={`/cards/new?type=${type}`}>
              <span
                aria-hidden
                className={cn(
                  "size-3.5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]",
                  CARD_TYPE_CHIP[type].dot,
                )}
              />
              {CARD_TYPE_LABELS[type]}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

function CreateCardForm({ type }: { type: CardType }) {
  const [state, formAction, pending] = useActionState(createCard, undefined);
  const images = useCardImages();

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        // Dispatch the action manually: submitting through the action prop
        // makes React reset the form afterwards, wiping every field when
        // validation fails.
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        // Picked Images process and upload first (ADR 0001); the action
        // only ever receives their storage paths, never the files. A failed
        // Image marks only itself — the Card save proceeds without it.
        void images.attachTo(formData).then(() => {
          startTransition(() => formAction(formData));
        });
      }}
      className="flex flex-col"
    >
      <input type="hidden" name="type" value={type} />
      <CreateCardHeader
        selectedType={type}
        actions={
          <Button type="submit" disabled={pending || images.uploading}>
            <Save />
            {pending || images.uploading ? "Saving…" : "Save Card"}
          </Button>
        }
      />
      <div className="flex flex-col gap-4 p-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="self-start text-muted-foreground"
        >
          <Link href="/cards/new">
            <ChevronLeft />
            Choose another type
          </Link>
        </Button>
        {state?.errors.form ? (
          <p role="alert" className="text-destructive text-sm">
            {state.errors.form}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            aria-invalid={state?.errors.title ? true : undefined}
          />
          {state?.errors.title ? (
            <p role="alert" className="text-destructive text-sm">
              {state.errors.title}
            </p>
          ) : null}
        </div>
        <CardTypeFields card={{ type }} />
        <ImagesField slot={images} />
        <TagsField />
      </div>
    </form>
  );
}
