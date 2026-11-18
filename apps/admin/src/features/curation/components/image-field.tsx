"use client";

import { DEFAULT_THEME_IMAGE } from "@mentis/contracts/admin";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { selectedImageError } from "../image-rule";

interface ImageFieldProps {
  path: string;
  publicBaseUrl?: string;
  file: File | null;
  isBusy: boolean;
  onFileChange: (file: File | null) => void;
  onReset?: () => void;
}

export const ImageField = ({
  path,
  publicBaseUrl,
  file,
  isBusy,
  onFileChange,
  onReset,
}: ImageFieldProps) => {
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

  const imageUrl = preview ?? (publicBaseUrl ? `${publicBaseUrl}${path}` : null);
  const isDefault = path === DEFAULT_THEME_IMAGE;

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
          {imageUrl ? (
            <span className="relative block aspect-[750/1024] w-40">
              <Image
                src={imageUrl}
                alt={file ? "Aperçu de l’image sélectionnée" : "Image actuelle du thème"}
                fill
                sizes="160px"
                unoptimized
                className="rounded-lg object-contain"
              />
            </span>
          ) : (
            <span className="flex aspect-[750/1024] w-40 items-center justify-center">
              Chargement de l’image…
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
      <p className="break-all text-xs text-orange-500 text-center pb-2">
        {path.split("/").at(-1)} {isDefault ? "(image par défaut)" : null}
      </p>
      <p id={helpId} className="text-xs text-zinc-500">
        Image <strong>WebP</strong> · <strong>750 × 1024 px</strong> · <strong>200 Ko</strong>{" "}
        maximum.
      </p>
      {file ? (
        <div className="flex flex-col gap-2 text-xs text-zinc-600">
          <p>{file.name} — aperçu local. L’image sera remplacée après SAVE.</p>
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
      {!isDefault && onReset ? (
        <button
          type="button"
          disabled={isBusy || file !== null}
          className="self-start text-sm text-zinc-600 hover:text-sky-700 disabled:opacity-40"
          onClick={onReset}
        >
          Supprimer l’image
        </button>
      ) : null}
      {file && !isDefault ? (
        <p className="text-xs text-zinc-500">
          Annulez la sélection avant de supprimer l’image actuelle.
        </p>
      ) : null}
      <p role="alert" className="text-sm text-zinc-700 min-h-6 border-b-zinc-300 border-b-[1px]">
        {error ? <span>{error}</span> : null}
      </p>
    </div>
  );
};
