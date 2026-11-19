"use client";

import { DEFAULT_THEME_IMAGE } from "@mentis/contracts/admin";
import { ImageDropZone } from "./image-drop-zone";

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
  const isDefault = path === DEFAULT_THEME_IMAGE;

  return (
    <ImageDropZone
      imageUrl={publicBaseUrl ? `${publicBaseUrl}${path}` : null}
      imageAlt="Image actuelle du thème"
      emptyFrameLabel="Chargement de l’image…"
      file={file}
      isBusy={isBusy}
      onFileChange={onFileChange}
      caption={
        <p className="break-all text-xs text-orange-500 text-center pb-2">
          {path.split("/").at(-1)} {isDefault ? "(image par défaut)" : null}
        </p>
      }
    >
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
    </ImageDropZone>
  );
};
