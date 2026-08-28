import type { PropsWithChildren } from "react";

interface FieldProps extends PropsWithChildren {
  label: string;
}

export const Field = ({ label, children }: FieldProps) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
      <div className="text-sm text-zinc-900">{children}</div>
    </div>
  );
};
