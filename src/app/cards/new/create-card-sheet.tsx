"use client";

import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { createCard } from "@/lib/cards/actions";
import { CARD_TYPE_LABELS, CARD_TYPES } from "@/lib/cards/schema";

export function CreateCardSheet({
  selectedType,
}: {
  selectedType?: "anecdote";
}) {
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
        {selectedType ? <AnecdoteForm /> : <CardTypePicker />}
      </SheetContent>
    </Sheet>
  );
}

function CardTypePicker() {
  return (
    <div className="flex flex-col gap-2 p-4">
      {CARD_TYPES.map((type) =>
        type === "anecdote" ? (
          <Button
            key={type}
            asChild
            variant="outline"
            className="justify-start"
          >
            <Link href={`/cards/new?type=${type}`}>
              {CARD_TYPE_LABELS[type]}
            </Link>
          </Button>
        ) : (
          <Button
            key={type}
            variant="outline"
            className="justify-start"
            disabled
          >
            {CARD_TYPE_LABELS[type]} — coming soon
          </Button>
        ),
      )}
    </div>
  );
}

function AnecdoteForm() {
  const [state, formAction, pending] = useActionState(createCard, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4 p-4">
      <input type="hidden" name="type" value="anecdote" />
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Body</Label>
        <Textarea id="body" name="body" rows={12} />
      </div>
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
