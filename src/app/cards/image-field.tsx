"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { decodeImage, uploadCardImage } from "@/lib/images/browser";
import {
  IMAGE_FILE_EXTENSIONS,
  imageDimensionsError,
  imageFormatError,
} from "@/lib/images/pipeline";

// Single Image slot shared by the create and edit forms. The picked file
// stays in the browser until save; attachTo processes and uploads it then,
// stamping the storage path onto the outgoing form data (ADR 0001).

export type CardImageSlot = {
  file: File | null;
  uploading: boolean;
  uploadError: string | null;
  selectFile: (file: File | null) => void;
  attachTo: (formData: FormData) => Promise<boolean>;
};

export function useCardImage(): CardImageSlot {
  const [file, setFile] = useState<File | null>(null);
  // Kept once uploaded so a save retried after a validation error does not
  // re-process and re-upload the same file.
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function selectFile(next: File | null) {
    setFile(next);
    setUploadedPath(null);
    setUploadError(null);
  }

  // Resolves to false when processing or uploading failed — the save must
  // not proceed without the Image it was asked to carry.
  async function attachTo(formData: FormData): Promise<boolean> {
    if (!file) return true;
    let path = uploadedPath;
    if (!path) {
      setUploading(true);
      setUploadError(null);
      try {
        path = await uploadCardImage(file);
        setUploadedPath(path);
      } catch {
        setUploadError(
          "Processing or uploading the Image failed. The Card was not saved.",
        );
        return false;
      } finally {
        setUploading(false);
      }
    }
    formData.set("imagePath", path);
    return true;
  }

  return { file, uploading, uploadError, selectFile, attachTo };
}

export function ImageField({
  slot,
  storedImageUrl,
}: {
  slot: CardImageSlot;
  storedImageUrl?: string | null;
}) {
  const [pickError, setPickError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { file } = slot;
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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
    slot.selectFile(picked);
  }

  const preview = file ? previewUrl : storedImageUrl;
  const error = pickError ?? slot.uploadError;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="image">Image</Label>
      {preview ? (
        <div className="flex items-start gap-1">
          {/* biome-ignore lint/performance/noImgElement: the preview is a
              blob: object URL with unknown dimensions, which next/image
              cannot optimize. */}
          <img
            src={preview}
            alt="Attached illustration"
            className="h-40 w-auto rounded-lg border border-border"
          />
          {file ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove picked Image"
              onClick={() => slot.selectFile(null)}
            >
              <X />
            </Button>
          ) : null}
        </div>
      ) : null}
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
      {slot.uploading ? (
        <p className="text-muted-foreground text-sm">
          Processing and uploading the Image…
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
