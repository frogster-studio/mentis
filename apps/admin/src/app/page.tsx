import { LogoWordmark } from "@/components/logo-wordmark";
import { logout } from "@/lib/auth/actions";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col p-6">
      <form action={logout} className="flex justify-end">
        <button
          type="submit"
          className="text-sm text-zinc-400 transition-colors hover:text-zinc-600"
        >
          Sign out
        </button>
      </form>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-16">
        <LogoWordmark className="h-10 w-auto text-zinc-900" />
        <p className="text-zinc-400">Nothing here yet.</p>
      </div>
    </main>
  );
}
