import { Suspense } from "react";

import { AppHeader } from "@/components/app-header";
import { CurationDashboard } from "@/features/curation/components/curation-dashboard";

export default function HomePage() {
  return (
    <Suspense fallback={<AppHeader />}>
      <CurationDashboard />
    </Suspense>
  );
}
