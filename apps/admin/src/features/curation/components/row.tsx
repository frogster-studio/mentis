import type { PropsWithChildren, ReactNode } from "react";

interface RowProps extends PropsWithChildren {
  isSelected: boolean;
  onSelect: () => void;
  trailing?: ReactNode;
}

export const Row = ({ isSelected, onSelect, trailing, children }: RowProps) => {
  return (
    <div
      className={`flex w-full items-center border-zinc-100 border-b text-sm transition-colors last:border-b-0 ${
        isSelected ? "bg-sky-50 text-sky-700" : "hover:bg-zinc-50"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left"
      >
        {children}
      </button>
      {trailing ? <div className="shrink-0 pr-4">{trailing}</div> : null}
    </div>
  );
};
