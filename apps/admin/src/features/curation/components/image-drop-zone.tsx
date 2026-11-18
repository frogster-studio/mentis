"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { selectedImageError } from "../image-rule";

interface ImageDropZoneProps {
  imageUrl: string | null;
  imageAlt: string;
  emptyFrameLabel?: string;
  file: File | null;
  isBusy: boolean;
  onFileChange: (file: File | null) => void;
  caption?: ReactNode;
  children?: ReactNode;
}

export const ImageDropZone = ({
  imageUrl,
  imageAlt,
  emptyFrameLabel,
  file,
  isBusy,
  onFileChange,
  caption,
  children,
}: ImageDropZoneProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const dragDepth = useRef(0);
  const helpId = useId();

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(
    () => () => {
      generation.current += 1;
    },
    [],
  );

  const pick = async (files: File[]) => {
    if (isBusy || files.length === 0) return;
    const current = ++generation.current;
    const ruleError = await selectedImageError(files);
    if (current !== generation.current) return;
    setError(ruleError);
    if (ruleError === null) onFileChange(files[0]);
  };

  const shownUrl = preview ?? imageUrl;

  return (
    <div className="flex flex-col gap-3">
      <fieldset
        aria-label="Importer une image"
        data-dragging={isDragging}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!isBusy) {
            dragDepth.current += 1;
            setIsDragging(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = isBusy ? "none" : "copy";
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (!dragDepth.current) setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setIsDragging(false);
          void pick(Array.from(event.dataTransfer.files));
        }}
        className={`rounded-lg border border-dashed p-4 transition-colors focus-within:border-sky-500 focus-within:bg-sky-50 ${isDragging ? "border-sky-500 bg-sky-50" : "border-zinc-300 bg-zinc-50 hover:border-sky-400 hover:bg-sky-50"}`}
      >
        <button
          type="button"
          disabled={isBusy}
          onClick={() => input.current?.click()}
          aria-describedby={helpId}
          className="flex w-full flex-col items-center gap-3 rounded-lg text-sm text-zinc-600 outline-none disabled:cursor-wait"
        >
          {shownUrl ? (
            <span className="relative block aspect-[750/1024] w-40">
              <Image
                src={shownUrl}
                alt={file ? "Aperçu de l’image sélectionnée" : imageAlt}
                fill
                sizes="160px"
                unoptimized
                className="rounded-lg object-contain"
              />
            </span>
          ) : (
            <span className="flex aspect-[750/1024] w-40 items-center justify-center rounded-lg border border-dashed border-zinc-300">
              {emptyFrameLabel}
            </span>
          )}
          <span>
            {isDragging ? "Déposez votre image ici" : "Glissez une image ou choisissez un fichier"}
          </span>
        </button>
        <input
          ref={input}
          type="file"
          accept=".webp,image/webp"
          disabled={isBusy}
          className="sr-only"
          aria-label="Choisir une image"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void pick(files);
          }}
        />
      </fieldset>
      {caption}
      <p id={helpId} className="text-xs text-zinc-500">
        Image <strong>WebP</strong> · <strong>750 × 1024 px</strong> · <strong>200 Ko</strong>{" "}
        maximum.
      </p>
      {file ? (
        <div className="flex flex-col gap-2 text-xs text-zinc-600">
          <p>{file.name} — aperçu local. L’image sera enregistrée après SAVE.</p>
          <button
            type="button"
            disabled={isBusy}
            className="self-start text-sky-700 hover:underline disabled:opacity-50"
            onClick={() => {
              generation.current += 1;
              onFileChange(null);
              setError(null);
            }}
          >
            Annuler la sélection
          </button>
        </div>
      ) : null}
      {children}
      <p role="alert" className="text-sm text-zinc-700 min-h-6 border-b-zinc-300 border-b-[1px]">
        {error ? <span>{error}</span> : null}
      </p>
    </div>
  );
};
