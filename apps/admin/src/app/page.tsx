import { Suspense } from "react";

import { AppHeader } from "@/components/app-header";
import { CurationDashboard } from "@/features/curation/components/curation-dashboard";

export default function HomePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-50">
      <AppHeader />
      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col p-6">
        <Suspense>
          <CurationDashboard />
        </Suspense>
      </main>
    </div>
  );
}
