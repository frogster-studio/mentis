import { LogoWordmark } from "@/components/logo-wordmark";
import { logout } from "@/lib/auth/actions";

export const AppHeader = () => {
  return (
    <header className="sticky top-0 z-40 grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-zinc-200 border-b bg-white/80 px-6 backdrop-blur">
      <LogoWordmark className="h-5 w-auto text-zinc-900" />
      <div />
      <form action={logout} className="flex justify-end">
        <button
          type="submit"
          className="text-sm text-zinc-400 transition-colors hover:text-zinc-600"
        >
          Sign out
        </button>
      </form>
    </header>
  );
};
