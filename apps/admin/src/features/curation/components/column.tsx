import type { PropsWithChildren } from "react";

import { Notice } from "./notice";

interface ColumnProps extends PropsWithChildren {
  title: string;
  isLoading?: boolean;
  isEmpty: boolean;
  emptyLabel: string;
  create?: { label: string; onSelect: () => void };
}

export const Column = ({
  title,
  isLoading = false,
  isEmpty,
  emptyLabel,
  create,
  children,
}: ColumnProps) => {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xs">
      <div className="flex items-center justify-between gap-2 border-zinc-200 border-b bg-zinc-50 px-4 py-2">
        <h2 className="text-xs text-zinc-500 uppercase tracking-wide">{title}</h2>
        {create ? (
          <button
            type="button"
            onClick={create.onSelect}
            className="shrink-0 rounded-lg px-2 py-0.5 text-sky-700 text-xs transition-colors hover:bg-sky-100"
          >
            {create.label}
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? <Notice>Loading…</Notice> : null}
        {!isLoading && isEmpty ? <Notice>{emptyLabel}</Notice> : null}
        {!isLoading && !isEmpty ? children : null}
      </div>
    </section>
  );
};
