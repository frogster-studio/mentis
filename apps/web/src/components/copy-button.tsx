"use client";

import { useEffect, useState } from "react";

const COPY_LABEL = "Copier";
const COPIED_LABEL = "Copié";
const COPIED_DURATION_MS = 2000;

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), COPIED_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [copied]);

  // A convenience beside the text, never the only path: without the clipboard API, nothing happens.
  const copy = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 hover:border-sky-300 hover:text-sky-600"
    >
      {copied ? COPIED_LABEL : COPY_LABEL}
    </button>
  );
}
