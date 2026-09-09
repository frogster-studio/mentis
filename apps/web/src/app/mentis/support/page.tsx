import type { Metadata } from "next";

import { PUBLISHER } from "@/lib/publisher";

const FAQ = [
  {
    question: "Comment supprimer mon compte ?",
    answer:
      "Depuis l'application, ouvrez l'écran Compte puis « Supprimer mon compte ». La suppression est immédiate et irréversible : le compte, le pseudo, les scores et l'ensemble des données associées sont effacés. Rien n'est conservé, et l'application reste jouable sans compte.",
  },
  {
    question: "Comment gérer ou résilier mon abonnement ?",
    answer:
      "L'abonnement Mentis Premium se gère et se résilie dans les réglages d'abonnement de l'App Store sur iPhone, ou de Google Play sur Android — jamais dans l'application. La résiliation prend effet à la fin de la période en cours ; pensez à l'effectuer au moins 24 heures avant ce terme.",
  },
  {
    question: "J'ai déjà payé, comment restaurer mon achat ?",
    answer:
      "Sur l'écran de l'abonnement, appuyez sur « Restaurer mes achats ». L'appareil doit être connecté au même compte App Store ou Google Play que celui utilisé lors de l'achat : c'est le magasin, et non Mentis, qui détient la preuve de l'abonnement.",
  },
  {
    question: "Une question du quiz est erronée, que faire ?",
    answer:
      `Écrivez-nous à ${PUBLISHER.email} en précisant le thème et la question concernée. ` +
      "Ces deux informations suffisent à retrouver la question dans le catalogue et à la corriger.",
  },
];

export const metadata: Metadata = {
  title: "Support — Mentis",
};

export default function SupportPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-16 px-6 py-24">
      <section className="flex flex-col gap-6">
        <h1 className="text-4xl">Support</h1>
        <p className="text-lg text-zinc-600">
          Une question, un problème, une demande relative à vos données : écrivez à{" "}
          <a href={`mailto:${PUBLISHER.email}`} className="text-sky-600 hover:underline">
            {PUBLISHER.email}
          </a>
          . C'est la seule adresse de contact de {PUBLISHER.tradeName}, et la réponse arrive sous
          quelques jours.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Questions fréquentes</h2>
        <dl className="flex flex-col gap-8">
          {FAQ.map((entry) => (
            <div key={entry.question} className="flex flex-col gap-2">
              <dt className="text-sm text-zinc-900">{entry.question}</dt>
              <dd className="text-sm text-zinc-600">{entry.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
