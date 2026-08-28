import type { PropsWithChildren } from "react";

interface TonalButtonProps extends PropsWithChildren {
  type: "button" | "submit";
  onClick?: () => void;
  isDisabled?: boolean;
}

export const TonalButton = ({ type, onClick, isDisabled = false, children }: TonalButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className="shrink-0 rounded-lg bg-sky-100 px-3 py-2 text-sky-700 text-sm transition-colors hover:bg-sky-600 hover:text-white disabled:bg-zinc-100 disabled:text-zinc-400"
    >
      {children}
    </button>
  );
};
