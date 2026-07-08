import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-background p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Mentis
        </h1>
        <p className="max-w-md text-muted-foreground">
          The Card library back-office is under construction.
        </p>
      </div>
      <Button>
        <Sparkles />
        Walking skeleton
      </Button>
    </main>
  );
}
