import type { Metadata } from "next";

import { PUBLISHER } from "@/lib/publisher";
import { ROUTES } from "@/lib/routes";

const LAST_UPDATED = "9 septembre 2026";

const SUBSCRIPTION_ROWS = [
  { label: "Nom", value: "Mentis Premium" },
  { label: "Durée", value: "Un mois, renouvelé automatiquement" },
  { label: "Prix", value: "2,99 € par mois, sans période d'essai" },
  { label: "Renouvellement", value: "Au même prix, sauf annulation" },
];

const PREMIUM_FEATURES = [
  "Rejouer la compétition quotidienne, une seconde fois le même jour.",
  "Lancer en rattrapage la compétition de la veille, si elle n'a pas été jouée.",
];

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Mentis",
};

export default function TermsPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-16 px-6 py-24">
      <section className="flex flex-col gap-6">
        <h1 className="text-4xl">Conditions d'utilisation</h1>
        <p className="text-lg text-zinc-600">
          Les règles d'usage de l'application Mentis, éditée par {PUBLISHER.tradeName}.
        </p>
        <p className="text-sm text-zinc-500">Dernière mise à jour : {LAST_UPDATED}</p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Objet</h2>
        <p className="text-sm text-zinc-600">
          Mentis est une application de quiz éditée par {PUBLISHER.firstName} {PUBLISHER.lastName},{" "}
          {PUBLISHER.legalStatus.toLowerCase()} exerçant sous le nom commercial «{" "}
          {PUBLISHER.tradeName} », {PUBLISHER.address}. Installer et utiliser l'application vaut
          acceptation des présentes conditions.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Jouer sans compte</h2>
        <p className="text-sm text-zinc-600">
          Mentis se joue sans compte : les quiz sont accessibles dès l'installation, et les
          statistiques restent alors sur l'appareil. Le compte est facultatif ; il sert à participer
          à la compétition quotidienne, à apparaître au classement et à retrouver sa progression sur
          un autre appareil.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Le compte</h2>
        <p className="text-sm text-zinc-600">
          Le compte se crée avec Apple ou Google. Il est réservé aux personnes de 15 ans ou plus ;
          en dessous de cet âge, il requiert l'autorisation du titulaire de l'autorité parentale.
          Vous êtes responsable de l'accès à votre compte Apple ou Google, seule clé de votre compte
          Mentis. Le compte se supprime à tout moment depuis l'écran Compte : la suppression est
          immédiate, irréversible, et efface l'ensemble des données associées.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Le pseudo</h2>
        <p className="text-sm text-zinc-600">
          Chaque compte porte un pseudo, créé par l'application à la première connexion, unique
          parmi tous les joueurs et modifiable à tout moment. Il est affiché publiquement au
          classement, y compris aux visiteurs non connectés. Un pseudo injurieux, trompeur, ou
          portant atteinte aux droits d'un tiers peut être modifié ou retiré.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Loyauté du jeu</h2>
        <p className="text-sm text-zinc-600">
          La compétition quotidienne repose sur la loyauté des joueurs : elle se joue soi-même, sans
          automatisation, sans script, sans outil tiers et sans exploitation d'une faille de
          l'application. En cas d'abus de la compétition, l'éditeur peut retirer les scores
          concernés, suspendre l'accès à la compétition ou fermer le compte.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Abonnement Mentis Premium</h2>
        <dl className="flex flex-col gap-3 text-sm">
          {SUBSCRIPTION_ROWS.map((row) => (
            <div key={row.label} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="text-zinc-500 sm:w-64 sm:shrink-0">{row.label}</dt>
              <dd className="text-zinc-900">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-zinc-600">L'abonnement débloque deux fonctionnalités :</p>
        <ul className="flex flex-col gap-3 text-sm text-zinc-600">
          {PREMIUM_FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <p className="text-sm text-zinc-600">
          L'abonnement est renouvelé automatiquement au même prix à la fin de chaque période, sauf
          annulation au moins 24 heures avant ce terme. Il se gère et s'annule dans les réglages
          d'abonnement de l'App Store ou de Google Play, jamais dans l'application. Le paiement est
          encaissé par Apple ou Google, et les demandes de remboursement relèvent de leurs
          conditions respectives.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Disponibilité et évolution</h2>
        <p className="text-sm text-zinc-600">
          L'application peut évoluer : des quiz, des thèmes et des fonctionnalités sont ajoutés ou
          retirés. Le service est fourni en l'état, sans garantie de disponibilité continue ; une
          interruption technique ne donne pas droit à indemnité. En cas de modification des
          présentes conditions, la date de dernière mise à jour ci-dessus est actualisée.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Propriété</h2>
        <p className="text-sm text-zinc-600">
          L'application, son contenu et ses questions restent la propriété de l'éditeur. Ils sont
          mis à disposition pour un usage personnel, sans droit de reproduction ni d'exploitation.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Droit applicable et contact</h2>
        <p className="text-sm text-zinc-600">
          Les présentes conditions sont soumises au droit français. Le traitement des données
          personnelles est décrit dans la{" "}
          <a href={ROUTES.privacy} className="text-sky-600 hover:underline">
            politique de confidentialité
          </a>
          . Pour toute question, écrivez à{" "}
          <a href={`mailto:${PUBLISHER.email}`} className="text-sky-600 hover:underline">
            {PUBLISHER.email}
          </a>
          .
        </p>
      </section>
    </main>
  );
}
