import type { Metadata } from "next";

import { PUBLISHER } from "@/lib/publisher";

const HOST = {
  name: "Vercel Inc.",
  address: "440 N Barranca Ave #4133, Covina, CA 91723, United States",
};

const EDITOR_ROWS = [
  { label: "Nom", value: `${PUBLISHER.firstName} ${PUBLISHER.lastName}` },
  { label: "Nom commercial", value: PUBLISHER.tradeName },
  { label: "Statut", value: PUBLISHER.legalStatus },
  { label: "Adresse", value: PUBLISHER.address },
  { label: "Téléphone", value: PUBLISHER.phone, href: `tel:+33${PUBLISHER.phone.slice(1)}` },
  { label: "Email", value: PUBLISHER.email, href: `mailto:${PUBLISHER.email}` },
  { label: "SIRET", value: PUBLISHER.siret },
  { label: "Directeur de la publication", value: PUBLISHER.publicationDirector },
];

const HOST_ROWS = [
  { label: "Hébergeur", value: HOST.name },
  { label: "Adresse", value: HOST.address },
];

export const metadata: Metadata = {
  title: "Mentions légales — Frogster Studio",
};

function Rows({ rows }: { rows: { label: string; value: string; href?: string }[] }) {
  return (
    <dl className="flex flex-col gap-3 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
          <dt className="text-zinc-500 sm:w-64 sm:shrink-0">{row.label}</dt>
          <dd className="text-zinc-900">
            {row.href ? (
              <a href={row.href} className="text-sky-600 hover:underline">
                {row.value}
              </a>
            ) : (
              row.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function LegalPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-16 px-6 py-24">
      <section className="flex flex-col gap-6">
        <h1 className="text-4xl">Mentions légales</h1>
        <p className="text-lg text-zinc-600">
          Informations légales du site frogster-studio.com et de son éditeur.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Éditeur du site</h2>
        <Rows rows={EDITOR_ROWS} />
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Hébergement</h2>
        <Rows rows={HOST_ROWS} />
      </section>
    </main>
  );
}
