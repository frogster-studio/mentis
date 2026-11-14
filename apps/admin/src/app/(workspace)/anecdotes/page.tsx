import { Suspense } from "react";

import { AppHeader } from "@/components/app-header";
import { AnecdotesWorkspace } from "@/features/curation/components/anecdotes-workspace";

export default function AnecdotesPage() {
  return (
    <Suspense fallback={<AppHeader />}>
      <AnecdotesWorkspace />
    </Suspense>
  );
}
