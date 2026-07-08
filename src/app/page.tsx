import { LogOut, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";

export default function Home() {
  return (
    <>
      <header className="flex items-center justify-between border-border border-b px-6 py-3">
        <span className="font-semibold text-foreground">Mentis</span>
        <form action={logout}>
          <Button type="submit" variant="ghost">
            <LogOut />
            Log out
          </Button>
        </form>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-background p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-semibold text-3xl text-foreground tracking-tight">
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
    </>
  );
}
