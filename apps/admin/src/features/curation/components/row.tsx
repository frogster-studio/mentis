import type { PropsWithChildren } from "react";

interface RowProps extends PropsWithChildren {
  isSelected: boolean;
  onSelect: () => void;
}

export const Row = ({ isSelected, onSelect, children }: RowProps) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 border-zinc-100 border-b px-4 py-2.5 text-left text-sm transition-colors last:border-b-0 ${
        isSelected ? "bg-sky-50 text-sky-700" : "hover:bg-zinc-50"
      }`}
    >
      {children}
    </button>
  );
};
