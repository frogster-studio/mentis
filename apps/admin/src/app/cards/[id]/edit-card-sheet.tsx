"use client";

import { type AdminCardResponse, CARD_TYPES, type CardType } from "@mentis/contracts/admin";
import { Trash2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { cardFormSubmit, FormErrorText, SaveCardButton, TitleField } from "@/app/cards/card-form";
import { CardTypeFields } from "@/app/cards/card-type-fields";
import { ImagesField, type StoredCardImage, useCardImages } from "@/app/cards/image-field";
import { TagsField } from "@/app/cards/tags-field";
import { TypeDot } from "@/components/type-dot";
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
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { deleteCard, updateCard } from "@/lib/cards/actions";
import { CARD_TYPE_LABELS } from "@/lib/cards/labels";

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
  storedImages,
}: {
  card: AdminCardResponse;
  storedImages: StoredCardImage[];
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
        showCloseButton={false}
        className="overflow-y-auto p-0 data-[side=right]:w-1/2 data-[side=right]:sm:max-w-none"
      >
        <EditCardForm key={card.id} card={card} storedImages={storedImages} />
      </SheetContent>
    </Sheet>
  );
}

function EditCardForm({
  card,
  storedImages,
}: {
  card: AdminCardResponse;
  storedImages: StoredCardImage[];
}) {
  const [state, formAction, pending] = useActionState(updateCard, undefined);
  const images = useCardImages(storedImages);
  // The form's Card Type — diverges from the stored card.type between a
  // confirmed type change and the next save.
  const [type, setType] = useState<CardType>(card.type);
  // A different type picked in the select, staged until the warning dialog
  // is confirmed or cancelled.
  const [pendingType, setPendingType] = useState<CardType | null>(null);

  return (
    <form
      action={formAction}
      onSubmit={cardFormSubmit(images, formAction)}
      className="flex flex-col"
    >
      <input type="hidden" name="id" value={card.id} />
      <input type="hidden" name="type" value={type} />
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-popover px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <SheetTitle>Edit Card</SheetTitle>
          <SheetDescription>{CARD_TYPE_LABELS[card.type]}</SheetDescription>
        </div>
        <div className="flex items-center gap-2">
          {state?.savedAt && !pending ? (
            <span className="text-muted-foreground text-xs">Saved</span>
          ) : null}
          <SaveCardButton busy={pending || images.uploading} />
          <DeleteCardButton card={card} />
          <SheetClose asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Close">
              <X />
            </Button>
          </SheetClose>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4">
        {state?.errors.form ? <FormErrorText message={state.errors.form} /> : null}
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
              {/* The switcher always names a real type, so its dot always
                  rides into the trigger. */}
              <TypeDot type={type} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARD_TYPES.map((cardType) => (
                <SelectItem key={cardType} value={cardType} leading={<TypeDot type={cardType} />}>
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
                The {CARD_TYPE_LABELS[type]} fields — {CARD_TYPE_FIELD_SUMMARY[type]} — will be
                cleared. Title, Tags, and Images are kept. Nothing changes until you save the Card.
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
        <TitleField defaultValue={card.title} error={state?.errors.title} />
        {/* Keyed on the type so a confirmed switch remounts the fields empty —
          without it, Anecdote ↔ Did You Know share a subtree and keep their
          uncontrolled values. Back on the stored type, the saved payload
          returns: nothing is lost until save. */}
        <CardTypeFields key={type} card={type === card.type ? card : { type }} />
        <ImagesField slot={images} />
        <TagsField defaultTags={card.tags} />
        <div className="flex gap-4 text-muted-foreground text-xs">
          <span>Created {timestampFormatter.format(new Date(card.createdAt))}</span>
          <span>Updated {timestampFormatter.format(new Date(card.updatedAt))}</span>
        </div>
      </div>
    </form>
  );
}

function DeleteCardButton({ card }: { card: AdminCardResponse }) {
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
