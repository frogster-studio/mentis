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
    <section className="flex min-h-0 flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between gap-2 border-zinc-200 border-b bg-zinc-50 px-4 py-2">
        <h2 className="text-xs text-zinc-500 uppercase tracking-wide">{title}</h2>
        {create ? (
          <button
            type="button"
            onClick={create.onSelect}
            title={create.label}
            aria-label={create.label}
            className="-my-1 flex size-6 shrink-0 items-center justify-center rounded-lg text-sky-700 transition-colors hover:bg-sky-100"
          >
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M8 3.5v9M3.5 8h9" />
            </svg>
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
