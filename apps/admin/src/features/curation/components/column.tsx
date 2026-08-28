import type { PropsWithChildren } from "react";

import { Notice } from "./notice";

interface ColumnProps extends PropsWithChildren {
  title: string;
  isLoading?: boolean;
  isEmpty: boolean;
  emptyLabel: string;
}

export const Column = ({
  title,
  isLoading = false,
  isEmpty,
  emptyLabel,
  children,
}: ColumnProps) => {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xs">
      <h2 className="border-zinc-200 border-b bg-zinc-50 px-4 py-2.5 text-xs text-zinc-500 uppercase tracking-wide">
        {title}
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? <Notice>Loading…</Notice> : null}
        {!isLoading && isEmpty ? <Notice>{emptyLabel}</Notice> : null}
        {!isLoading && !isEmpty ? children : null}
      </div>
    </section>
  );
};
