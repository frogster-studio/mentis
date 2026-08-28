import type { PropsWithChildren } from "react";

interface BadgeProps extends PropsWithChildren {
  isOn: boolean;
}

export const Badge = ({ isOn, children }: BadgeProps) => {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
        isOn ? "bg-sky-100 text-sky-700" : "bg-zinc-100 text-zinc-500"
      }`}
    >
      {children}
    </span>
  );
};
