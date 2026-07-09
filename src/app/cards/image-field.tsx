"use client";

import { ArrowDown, ArrowUp, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_CARD_IMAGES } from "@/lib/cards/schema";
import { decodeImage, uploadCardImage } from "@/lib/images/browser";
import {
  IMAGE_FILE_EXTENSIONS,
  imageDimensionsError,
  imageFormatError,
  settleImages,
} from "@/lib/images/pipeline";

// Ordered Image list shared by the create and edit forms: up to three
// Images, each with an optional Caption, reorderable and removable. Picked
// files stay in the browser until save; attachTo processes and uploads them
// then, stamping ordered path/Caption pairs onto the outgoing form data
// (ADR 0001). Each Image succeeds or fails on its own — a failure marks
// only its own Image and never blocks the Card save. Removing a stored
// Image only drops it from the list here — the server deletes its storage
// object when the save lands.

// Shown on the red strip of a failed thumbnail. The underlying error goes
// to the console: server action messages are masked in production, so the
// raw text is not reliably user-readable.
const IMAGE_SAVE_FAILED = "This Image failed to save.";

// A Card Image already saved on the Card, shown from its public URL.
export type StoredCardImage = {
  path: string;
  caption: string;
  url: string;
};

type CardImageItem = {
  key: string;
  caption: string;
  // The picked file awaiting processing; null for stored Images.
  file: File | null;
  // The storage path: present for stored Images, set once a picked file
  // uploads. Kept after upload so a save retried after a validation error
  // does not re-process and re-upload the same file.
  path: string | null;
  // Public URL for stored Images, blob: object URL for picked files.
  previewUrl: string;
  // Set when this Image's last processing or upload attempt failed; shown
  // as the red strip on its thumbnail. Ephemeral — never persisted.
  error: string | null;
};

export type CardImagesSlot = {
  items: CardImageItem[];
  uploading: boolean;
  addFile: (file: File) => void;
  removeAt: (index: number) => void;
  moveBy: (index: number, offset: number) => void;
  setCaptionAt: (index: number, caption: string) => void;
  attachTo: (formData: FormData) => Promise<void>;
};

export function useCardImages(
  storedImages: StoredCardImage[] = [],
): CardImagesSlot {
  const [items, setItems] = useState<CardImageItem[]>(() =>
    storedImages.map((stored) => ({
      key: stored.path,
      caption: stored.caption,
      file: null,
      path: stored.path,
      previewUrl: stored.url,
      error: null,
    })),
  );
  const [uploading, setUploading] = useState(false);

  // Object URLs live until revoked, so previews of picked files are released
  // when their Image leaves the list or the form unmounts.
  const objectUrls = useRef(new Set<string>());
  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  function addFile(file: File) {
    setItems((current) => {
      if (current.length >= MAX_CARD_IMAGES) return current;
      const previewUrl = URL.createObjectURL(file);
      objectUrls.current.add(previewUrl);
      return [
        ...current,
        {
          key: crypto.randomUUID(),
          caption: "",
          file,
          path: null,
          previewUrl,
          error: null,
        },
      ];
    });
  }

  function removeAt(index: number) {
    setItems((current) => {
      const removed = current[index];
      if (removed?.file) {
        URL.revokeObjectURL(removed.previewUrl);
        objectUrls.current.delete(removed.previewUrl);
      }
      return current.filter((_, i) => i !== index);
    });
  }

  function moveBy(index: number, offset: number) {
    setItems((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function setCaptionAt(index: number, caption: string) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, caption } : item)),
    );
  }

  // Processes and uploads every pending file independently, then stamps the
  // ordered path/Caption pairs of the stored and successful Images onto the
  // outgoing form data. A failure marks only its own Image with the red
  // strip and leaves it off the form data — the Card save always proceeds.
  async function attachTo(formData: FormData): Promise<void> {
    const paths = new Map<string, string>();
    for (const item of items) {
      if (item.path) paths.set(item.key, item.path);
    }
    const pending = items.filter((item) => item.file && !item.path);
    if (pending.length > 0) {
      setUploading(true);
      const pendingKeys = new Set(pending.map((item) => item.key));
      setItems((current) =>
        current.map((c) =>
          pendingKeys.has(c.key) ? { ...c, error: null } : c,
        ),
      );
      const outcomes = await settleImages(pending, (item) =>
        uploadCardImage(item.file as File),
      );
      const failedKeys = new Set<string>();
      outcomes.forEach((outcome, index) => {
        const key = pending[index].key;
        if (outcome.status === "success") {
          paths.set(key, outcome.value);
        } else {
          console.error(`Card Image failed to save: ${outcome.message}`);
          failedKeys.add(key);
        }
      });
      setItems((current) =>
        current.map((c) => {
          if (failedKeys.has(c.key)) return { ...c, error: IMAGE_SAVE_FAILED };
          const path = paths.get(c.key);
          return path && !c.path ? { ...c, path } : c;
        }),
      );
      setUploading(false);
    }
    for (const item of items) {
      const path = paths.get(item.key);
      if (!path) continue;
      formData.append("imagePaths", path);
      formData.append("imageCaptions", item.caption);
    }
  }

  return {
    items,
    uploading,
    addFile,
    removeAt,
    moveBy,
    setCaptionAt,
    attachTo,
  };
}

export function ImagesField({ slot }: { slot: CardImagesSlot }) {
  const [pickError, setPickError] = useState<string | null>(null);
  const full = slot.items.length >= MAX_CARD_IMAGES;

  async function handlePick(picked: File) {
    const formatError = imageFormatError(picked.name);
    if (formatError) {
      setPickError(formatError);
      return;
    }
    let image: ImageBitmap;
    try {
      image = await decodeImage(picked);
    } catch {
      setPickError("This file could not be read as an image.");
      return;
    }
    const dimensionError = imageDimensionsError(image);
    image.close();
    if (dimensionError) {
      setPickError(dimensionError);
      return;
    }
    setPickError(null);
    slot.addFile(picked);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="image">Images</Label>
      {slot.items.map((item, index) => (
        <div key={item.key} className="flex items-start gap-2">
          <div className="relative shrink-0">
            {/* biome-ignore lint/performance/noImgElement: previews mix blob:
                object URLs with unknown dimensions and storage URLs, which
                next/image cannot optimize. */}
            <img
              src={item.previewUrl}
              alt={`Illustration ${index + 1}`}
              className="h-24 w-auto rounded-lg border border-border"
            />
            {item.error ? (
              <p
                role="alert"
                className="absolute inset-x-0 bottom-0 rounded-b-lg bg-destructive px-2 py-1 text-white text-xs"
              >
                {item.error}
              </p>
            ) : null}
          </div>
          <Input
            value={item.caption}
            placeholder="Caption (optional)"
            aria-label={`Caption for Image ${index + 1}`}
            onChange={(event) => slot.setCaptionAt(index, event.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Move Image ${index + 1} up`}
            disabled={index === 0 || slot.uploading}
            onClick={() => slot.moveBy(index, -1)}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Move Image ${index + 1} down`}
            disabled={index === slot.items.length - 1 || slot.uploading}
            onClick={() => slot.moveBy(index, 1)}
          >
            <ArrowDown />
          </Button>
          {item.error ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Retry Image ${index + 1}`}
              disabled={slot.uploading}
              // Retry is a plain re-save: attachTo re-processes only Images
              // without a path, so successful siblings never re-upload, and
              // the save then carries this Image onto the Card.
              onClick={(event) => event.currentTarget.form?.requestSubmit()}
            >
              <RotateCcw />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove Image ${index + 1}`}
            disabled={slot.uploading}
            onClick={() => slot.removeAt(index)}
          >
            <X />
          </Button>
        </div>
      ))}
      {full ? (
        <p className="text-muted-foreground text-sm">
          A Card carries at most three Images — remove one to add another.
        </p>
      ) : (
        <Input
          id="image"
          type="file"
          accept={IMAGE_FILE_EXTENSIONS.join(",")}
          onChange={(event) => {
            const picked = event.target.files?.[0];
            // Reset so re-picking the same file fires another change event.
            event.target.value = "";
            if (picked) void handlePick(picked);
          }}
        />
      )}
      {slot.uploading ? (
        <p className="text-muted-foreground text-sm">
          Processing and uploading the Images…
        </p>
      ) : null}
      {pickError ? (
        <p role="alert" className="text-destructive text-sm">
          {pickError}
        </p>
      ) : null}
    </div>
  );
}
