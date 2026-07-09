"use client";

import { Save, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useActionState } from "react";
import { AnecdoteFields, QuizFields } from "@/app/cards/card-type-fields";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Switch } from "@/components/ui/switch";
import { deleteCard, updateCard } from "@/lib/cards/actions";
import { CARD_TYPE_LABELS, type Card } from "@/lib/cards/schema";

const timestampFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

export function EditCardSheet({ card }: { card: Card }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  // Closing returns to the list URL with its query params intact.
  const listUrl = query ? `/?${query}` : "/";

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) router.push(listUrl);
      }}
    >
      <SheetContent
        side="right"
        className="overflow-y-auto data-[side=right]:w-1/2 data-[side=right]:sm:max-w-none"
      >
        <SheetHeader>
          <SheetTitle>Edit Card</SheetTitle>
          <SheetDescription>{CARD_TYPE_LABELS[card.type]}</SheetDescription>
        </SheetHeader>
        <EditCardForm key={card.id} card={card} />
      </SheetContent>
    </Sheet>
  );
}

function EditCardForm({ card }: { card: Card }) {
  const [state, formAction, pending] = useActionState(updateCard, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        // The delete form is DOM-portaled but React-nested inside this form,
        // so its submit bubbles here too — only handle our own.
        if (event.target !== event.currentTarget) return;
        // Dispatch the action manually: submitting through the action prop
        // makes React reset the form afterwards, which fires a reset event
        // that snaps the Switch back to its mount-time state.
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-4 p-4"
    >
      <input type="hidden" name="id" value={card.id} />
      <input type="hidden" name="type" value={card.type} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={card.title}
          aria-invalid={state?.errors.title ? true : undefined}
        />
        {state?.errors.title ? (
          <p role="alert" className="text-destructive text-sm">
            {state.errors.title}
          </p>
        ) : null}
      </div>
      {card.type === "quiz" ? (
        <QuizFields payload={card.payload} />
      ) : (
        <AnecdoteFields payload={card.payload} />
      )}
      <div className="flex items-center gap-2">
        <Switch
          id="status"
          name="status"
          value="published"
          defaultChecked={card.status === "published"}
        />
        <Label htmlFor="status">Published</Label>
      </div>
      <div className="flex gap-4 text-muted-foreground text-xs">
        <span>
          Created {timestampFormatter.format(new Date(card.createdAt))}
        </span>
        <span>
          Updated {timestampFormatter.format(new Date(card.updatedAt))}
        </span>
      </div>
      {state?.errors.form ? (
        <p role="alert" className="text-destructive text-sm">
          {state.errors.form}
        </p>
      ) : null}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            <Save />
            {pending ? "Saving…" : "Save Card"}
          </Button>
          {state?.savedAt && !pending ? (
            <span className="text-muted-foreground text-xs">Saved</span>
          ) : null}
        </div>
        <DeleteCardButton card={card} />
      </div>
    </form>
  );
}

function DeleteCardButton({ card }: { card: Card }) {
  const deleteAction = deleteCard.bind(null, card.id);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Delete Card"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this Card?</AlertDialogTitle>
          <AlertDialogDescription>
            “{card.title}” will be permanently deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {/* The form lives in the dialog's portal, so it never nests inside
              the edit form. */}
          <form action={deleteAction}>
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive">
                <Trash2 />
                Delete
              </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
