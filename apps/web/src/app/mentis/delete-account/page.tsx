import type { Metadata } from "next";

import { CopyButton } from "@/components/copy-button";
import {
  buildDeletionMailto,
  DELETION_EMAIL_BODY,
  DELETION_EMAIL_BODY_LINES,
  DELETION_EMAIL_SUBJECT,
  IN_APP_STEPS,
} from "@/lib/delete-account";
import { PUBLISHER } from "@/lib/publisher";

const ERASED_DATA = [
  "Le compte et l'adresse e-mail qui l'identifie.",
  "Le pseudo.",
  "Les scores et les statistiques de jeu.",
  "Les sessions de quiz et leur historique.",
  "Les participations aux compétitions quotidiennes et les réponses saisies.",
  "Les places au classement.",
  "L'état de l'abonnement Mentis Premium conservé côté application.",
];

const KEPT_DATA = [
  `La preuve d'achat de l'abonnement, détenue par Apple, Google et RevenueCat : elle relève de leurs conditions, hors de portée de ${PUBLISHER.tradeName}.`,
];

export const metadata: Metadata = {
  title: "Supprimer mon compte — Mentis",
};

export default function DeleteAccountPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-16 px-6 py-24">
      <section className="flex flex-col gap-6">
        <h1 className="text-4xl">Supprimer mon compte Mentis</h1>
        <p className="text-lg text-zinc-600">
          Mentis est une application éditée par {PUBLISHER.tradeName}. Cette page explique comment
          demander la suppression de votre compte Mentis et des données associées.
        </p>
        <p className="text-sm text-zinc-600">
          La suppression est immédiate et irréversible : le compte et l'ensemble des données
          associées sont effacés, sans durée de conservation.
        </p>
      </section>

      <section className="flex flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-10">
        <h2 className="text-lg">Résiliez l'abonnement avant de supprimer</h2>
        <p className="text-sm text-zinc-600">
          Supprimer le compte ne résilie pas l'abonnement Mentis Premium : la facturation continue
          chez Apple ou Google. Résiliez-le d'abord dans les réglages d'abonnement de l'App Store
          sur iPhone, ou de Google Play sur Android.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Depuis l'application</h2>
        <p className="text-sm text-zinc-600">
          C'est la voie normale, et la suppression est effectuée sur-le-champ.
        </p>
        <ol className="flex flex-col gap-3 text-sm text-zinc-600">
          {IN_APP_STEPS.map((step, index) => (
            <li key={step}>
              {index + 1}. {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Par email</h2>
        <p className="text-sm text-zinc-600">
          Si vous n'avez plus l'application, écrivez à l'adresse ci-dessous{" "}
          <strong className="text-zinc-900">depuis l'adresse e-mail du compte</strong> : c'est elle
          qui nous permet de vérifier votre identité. La demande est traitée sous 30 jours, en
          pratique sous quelques jours, et la confirmation vous est envoyée une fois la suppression
          faite.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href={buildDeletionMailto(PUBLISHER.email)}
            className="text-sm text-sky-600 hover:underline"
          >
            {PUBLISHER.email}
          </a>
          <CopyButton text={PUBLISHER.email} />
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h3 className="text-sm text-zinc-900">Objet : {DELETION_EMAIL_SUBJECT}</h3>
            <CopyButton text={DELETION_EMAIL_BODY} />
          </div>
          <div className="flex flex-col gap-3 text-sm text-zinc-600">
            {DELETION_EMAIL_BODY_LINES.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Ce qui est effacé</h2>
        <ul className="flex flex-col gap-3 text-sm text-zinc-600">
          {ERASED_DATA.map((data) => (
            <li key={data}>{data}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Ce qui ne nous appartient pas</h2>
        <ul className="flex flex-col gap-3 text-sm text-zinc-600">
          {KEPT_DATA.map((data) => (
            <li key={data}>{data}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
