"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

export const Providers = ({ children }: PropsWithChildren) => {
  // The Catalog only ever changes from this dashboard, so mutations invalidate and nothing else ages.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY } },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
