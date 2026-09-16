"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { TonalButton } from "./tonal-button";

export function ThemeImageResetDialog({
  defaultUrl,
  isBusy,
  onDismiss,
  onConfirm,
}: {
  defaultUrl: string;
  isBusy: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const focused = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (focused instanceof HTMLElement) focused.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-label="Supprimer l’image du thème"
      aria-busy={isBusy}
      onCancel={(event) => {
        event.preventDefault();
        if (!isBusy) onDismiss();
      }}
      className="m-auto w-full max-w-md rounded-lg bg-white p-6 shadow-xl backdrop:bg-zinc-900/40"
    >
      <div className="flex flex-col gap-5">
        <h2 className="text-lg text-zinc-900">Supprimer l’image du thème ?</h2>
        <p className="text-sm text-zinc-600">
          L’image actuelle sera supprimée de Supabase Storage. default.webp deviendra immédiatement
          l’image associée au thème.
        </p>
        <div className="relative h-44 w-full">
          <Image
            src={defaultUrl}
            alt="Image par défaut : default.webp"
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            unoptimized
            className="rounded-lg object-contain"
          />
        </div>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            disabled={isBusy}
            onClick={onDismiss}
            className="text-sm text-zinc-500 disabled:opacity-50"
          >
            Annuler
          </button>
          <TonalButton type="button" isDisabled={isBusy} onClick={onConfirm}>
            {isBusy ? "Suppression…" : "Supprimer et réinitialiser"}
          </TonalButton>
        </div>
      </div>
    </dialog>
  );
}
