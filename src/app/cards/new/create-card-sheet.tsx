"use client";

import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState } from "react";

import { CardTypeFields } from "@/app/cards/card-type-fields";
import { TagsField } from "@/app/cards/tags-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createCard } from "@/lib/cards/actions";
import {
  CARD_TYPE_LABELS,
  CARD_TYPES,
  type CardType,
} from "@/lib/cards/schema";

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
        className="overflow-y-auto data-[side=right]:w-1/2 data-[side=right]:sm:max-w-none"
      >
        <SheetHeader>
          <SheetTitle>New Card</SheetTitle>
          <SheetDescription>
            {selectedType
              ? `Write the ${CARD_TYPE_LABELS[selectedType]} content.`
              : "Pick a Card Type to start writing."}
          </SheetDescription>
        </SheetHeader>
        {selectedType ? (
          <CreateCardForm type={selectedType} />
        ) : (
          <CardTypePicker />
        )}
      </SheetContent>
    </Sheet>
  );
}

function CardTypePicker() {
  return (
    <div className="flex flex-col gap-2 p-4">
      {CARD_TYPES.map((type) => (
        <Button key={type} asChild variant="outline" className="justify-start">
          <Link href={`/cards/new?type=${type}`}>{CARD_TYPE_LABELS[type]}</Link>
        </Button>
      ))}
    </div>
  );
}

function CreateCardForm({ type }: { type: CardType }) {
  const [state, formAction, pending] = useActionState(createCard, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        // Dispatch the action manually: submitting through the action prop
        // makes React reset the form afterwards, wiping every field when
        // validation fails.
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-4 p-4"
    >
      <input type="hidden" name="type" value={type} />
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
      <TagsField />
      {state?.errors.form ? (
        <p role="alert" className="text-destructive text-sm">
          {state.errors.form}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        <Save />
        {pending ? "Saving…" : "Save Card"}
      </Button>
    </form>
  );
}
