"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
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
} from "@/lib/images/pipeline";

// Ordered Image list shared by the create and edit forms: up to three
// Images, each with an optional Caption, reorderable and removable. Picked
// files stay in the browser until save; attachTo processes and uploads them
// then, stamping ordered path/Caption pairs onto the outgoing form data
// (ADR 0001). Removing a stored Image only drops it from the list here —
// the server deletes its storage object when the save lands.

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
};

export type CardImagesSlot = {
  items: CardImageItem[];
  uploading: boolean;
  uploadError: string | null;
  addFile: (file: File) => void;
  removeAt: (index: number) => void;
  moveBy: (index: number, offset: number) => void;
  setCaptionAt: (index: number, caption: string) => void;
  attachTo: (formData: FormData) => Promise<boolean>;
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
    })),
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        },
      ];
    });
    setUploadError(null);
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
    setUploadError(null);
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

  // Resolves to false when processing or uploading failed — the save must
  // not proceed without the Images it was asked to carry.
  async function attachTo(formData: FormData): Promise<boolean> {
    const paths = new Map<string, string>();
    for (const item of items) {
      if (item.path) paths.set(item.key, item.path);
    }
    const pending = items.filter((item) => item.file && !item.path);
    if (pending.length > 0) {
      setUploading(true);
      setUploadError(null);
      try {
        for (const item of pending) {
          const path = await uploadCardImage(item.file as File);
          paths.set(item.key, path);
          setItems((current) =>
            current.map((c) => (c.key === item.key ? { ...c, path } : c)),
          );
        }
      } catch {
        setUploadError(
          "Processing or uploading an Image failed. The Card was not saved.",
        );
        return false;
      } finally {
        setUploading(false);
      }
    }
    for (const item of items) {
      const path = paths.get(item.key);
      if (!path) continue;
      formData.append("imagePaths", path);
      formData.append("imageCaptions", item.caption);
    }
    return true;
  }

  return {
    items,
    uploading,
    uploadError,
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

  const error = pickError ?? slot.uploadError;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="image">Images</Label>
      {slot.items.map((item, index) => (
        <div key={item.key} className="flex items-start gap-2">
          {/* biome-ignore lint/performance/noImgElement: previews mix blob:
              object URLs with unknown dimensions and storage URLs, which
              next/image cannot optimize. */}
          <img
            src={item.previewUrl}
            alt={`Illustration ${index + 1}`}
            className="h-24 w-auto rounded-lg border border-border"
          />
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
            disabled={index === 0}
            onClick={() => slot.moveBy(index, -1)}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Move Image ${index + 1} down`}
            disabled={index === slot.items.length - 1}
            onClick={() => slot.moveBy(index, 1)}
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove Image ${index + 1}`}
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
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
