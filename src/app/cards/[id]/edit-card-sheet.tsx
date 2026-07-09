"use client";

import { Save, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useActionState, useState } from "react";
import { CardTypeFields } from "@/app/cards/card-type-fields";
import { ImageField, useCardImage } from "@/app/cards/image-field";
import { TagsField } from "@/app/cards/tags-field";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { deleteCard, updateCard } from "@/lib/cards/actions";
import {
  CARD_TYPE_LABELS,
  CARD_TYPES,
  type Card,
  type CardType,
} from "@/lib/cards/schema";

const timestampFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

// Named in the type-change warning so it says exactly what will be cleared.
const CARD_TYPE_FIELD_SUMMARY: Record<CardType, string> = {
  quiz: "the Question, the four Choices, and the Explanation",
  "true-false": "the Assertion, the answer, and the Explanation",
  anecdote: "the Body",
  "did-you-know": "the Body",
  riddle: "the Clues, the Answer, and the Bonus Info",
};

export function EditCardSheet({
  card,
  imageUrl,
}: {
  card: Card;
  imageUrl: string | null;
}) {
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
        <EditCardForm key={card.id} card={card} imageUrl={imageUrl} />
      </SheetContent>
    </Sheet>
  );
}

function EditCardForm({
  card,
  imageUrl,
}: {
  card: Card;
  imageUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateCard, undefined);
  const image = useCardImage();
  // The form's Card Type — diverges from the stored card.type between a
  // confirmed type change and the next save.
  const [type, setType] = useState<CardType>(card.type);
  // A different type picked in the select, staged until the warning dialog
  // is confirmed or cancelled.
  const [pendingType, setPendingType] = useState<CardType | null>(null);

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
        // A picked Image processes and uploads first (ADR 0001); the action
        // only ever receives its storage path, never the file.
        void image.attachTo(formData).then((ready) => {
          if (ready) startTransition(() => formAction(formData));
        });
      }}
      className="flex flex-col gap-4 p-4"
    >
      <input type="hidden" name="id" value={card.id} />
      <input type="hidden" name="type" value={type} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="card-type">Card Type</Label>
        <Select
          value={type}
          onValueChange={(value) => {
            // Picking another type only stages it; the select keeps showing
            // the current type until the warning dialog is confirmed.
            if (value !== type) setPendingType(value as CardType);
          }}
        >
          <SelectTrigger id="card-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CARD_TYPES.map((cardType) => (
              <SelectItem key={cardType} value={cardType}>
                {CARD_TYPE_LABELS[cardType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <AlertDialog
        open={pendingType !== null}
        onOpenChange={(open) => {
          if (!open) setPendingType(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {pendingType ? CARD_TYPE_LABELS[pendingType] : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The {CARD_TYPE_LABELS[type]} fields —{" "}
              {CARD_TYPE_FIELD_SUMMARY[type]} — will be cleared. Title, Tags,
              Status, and Images are kept. Nothing changes until you save the
              Card.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingType) setType(pendingType);
              }}
            >
              Switch Type
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      {/* Keyed on the type so a confirmed switch remounts the fields empty —
          without it, Anecdote ↔ Did You Know share a subtree and keep their
          uncontrolled values. Back on the stored type, the saved payload
          returns: nothing is lost until save. */}
      <CardTypeFields key={type} card={type === card.type ? card : { type }} />
      <ImageField slot={image} storedImageUrl={imageUrl} />
      <TagsField defaultTags={card.tags} />
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
          <Button type="submit" disabled={pending || image.uploading}>
            <Save />
            {pending || image.uploading ? "Saving…" : "Save Card"}
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
