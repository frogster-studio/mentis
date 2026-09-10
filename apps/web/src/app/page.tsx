import { LogoMark } from "@/components/logo-mark";

const STORE_BADGES = ["App Store · bientôt", "Google Play · bientôt"];

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-16 px-6 py-24">
      <section className="flex flex-col gap-6">
        <h1 className="text-4xl">Frogster Studio</h1>
        <p className="text-lg text-zinc-600">
          Un studio indépendant qui conçoit des applications mobiles de jeu.
        </p>
      </section>

      <article className="flex flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-10">
        <LogoMark className="size-10 text-sky-500" />
        <div className="flex flex-col gap-3">
          <h2 className="text-lg">Mentis</h2>
          <p className="text-sm text-zinc-600">
            Le quiz quotidien de culture générale : une compétition par jour, en français.
          </p>
        </div>
        <ul className="flex flex-wrap gap-3">
          {STORE_BADGES.map((badge) => (
            <li
              key={badge}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-500"
            >
              {badge}
            </li>
          ))}
        </ul>
      </article>
    </main>
  );
}
