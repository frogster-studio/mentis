import { Save } from "lucide-react";
import { type SubmitEventHandler, startTransition } from "react";
import type { CardImagesSlot } from "@/app/cards/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function cardFormSubmit(
  images: CardImagesSlot,
  formAction: (formData: FormData) => void,
): SubmitEventHandler<HTMLFormElement> {
  return (event) => {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    void images.attachTo(formData).then(() => {
      startTransition(() => formAction(formData));
    });
  };
}

// Header Save button; busy while the action runs or Images upload.
export function SaveCardButton({ busy }: { busy: boolean }) {
  return (
    <Button type="submit" disabled={busy}>
      <Save />
      {busy ? "Saving…" : "Save Card"}
    </Button>
  );
}

// A validation message, announced to screen readers.
export function FormErrorText({ message }: { message: string }) {
  return (
    <p role="alert" className="text-destructive text-sm">
      {message}
    </p>
  );
}

// The Title input with its validation message.
export function TitleField({ defaultValue, error }: { defaultValue?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="title">Title</Label>
      <Input
        id="title"
        name="title"
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
      />
      {error ? <FormErrorText message={error} /> : null}
    </div>
  );
}
