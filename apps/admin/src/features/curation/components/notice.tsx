import type { PropsWithChildren } from "react";

export const Notice = ({ children }: PropsWithChildren) => {
  return <p className="px-4 py-6 text-sm text-zinc-400">{children}</p>;
};
