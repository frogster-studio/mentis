import Image from "next/image";
import { useEffect, useState } from "react";

import { MIN_THEME_IMAGE_DIMENSION, THEME_IMAGE_EXTENSIONS } from "../theme-image";
import { uploadThemeImage } from "../theme-image-upload";

interface ImageFieldProps {
  path: string;
  isUploading: boolean;
  onUploadingChange: (isUploading: boolean) => void;
  onUploaded: (path: string) => void;
}

// The form owns the upload state: an explicit save must never race the bytes it names.
export const ImageField = ({
  path,
  isUploading,
  onUploadingChange,
  onUploaded,
}: ImageFieldProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (preview !== null) {
        URL.revokeObjectURL(preview);
      }
    },
    [preview],
  );

  const pick = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    // Cleared right away, so re-picking the very same file still fires a change.
    input.value = "";
    if (file === undefined) {
      return;
    }
    setError(null);
    onUploadingChange(true);
    try {
      const uploaded = await uploadThemeImage(file);
      setPreview(URL.createObjectURL(file));
      onUploaded(uploaded);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      onUploadingChange(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {preview === null ? (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-400">
            {path === "" ? "Empty" : "Stored"}
          </span>
        ) : (
          <Image
            src={preview}
            alt="Theme preview"
            width={64}
            height={64}
            // The preview is a local blob the optimizer can never fetch.
            unoptimized
            className="size-16 shrink-0 rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          accept={THEME_IMAGE_EXTENSIONS.join(",")}
          disabled={isUploading}
          onChange={(event) => {
            void pick(event.target);
          }}
          aria-label="Image"
          className="w-full text-sm text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:text-sky-700 file:text-sm file:transition-colors hover:file:bg-sky-600 hover:file:text-white"
        />
      </div>
      <p className="text-xs text-zinc-500">
        {isUploading
          ? "Resizing and uploading…"
          : path === ""
            ? `A PNG, JPEG or WebP of at least ${MIN_THEME_IMAGE_DIMENSION}×${MIN_THEME_IMAGE_DIMENSION}px — stored as webp.`
            : path}
      </p>
      {error ? (
        <p role="alert" className="text-red-600 text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
};
