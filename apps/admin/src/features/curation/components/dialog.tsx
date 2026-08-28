"use client";

import { type PropsWithChildren, useEffect } from "react";

import { TonalButton } from "./tonal-button";

interface DialogProps extends PropsWithChildren {
  title: string;
  onDismiss: () => void;
  confirm?: { label: string; onConfirm: () => void };
}

export const Dialog = ({ title, onDismiss, confirm, children }: DialogProps) => {
  useEffect(() => {
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };
    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex w-full max-w-md flex-col gap-6 rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg text-zinc-900">{title}</h2>
        <div className="flex flex-col gap-2 text-sm text-zinc-600">{children}</div>
        <div className="flex items-center justify-end gap-4">
          {confirm ? (
            <>
              <button
                type="button"
                onClick={onDismiss}
                className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
              >
                Cancel
              </button>
              <TonalButton type="button" onClick={confirm.onConfirm}>
                {confirm.label}
              </TonalButton>
            </>
          ) : (
            <TonalButton type="button" onClick={onDismiss}>
              Got it
            </TonalButton>
          )}
        </div>
      </div>
    </div>
  );
};
