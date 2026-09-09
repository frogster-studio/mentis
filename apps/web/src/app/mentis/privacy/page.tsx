import type { Metadata } from "next";

import { PUBLISHER } from "@/lib/publisher";

const LAST_UPDATED = "9 septembre 2026";

const COLLECTED_DATA = [
  {
    label: "Adresse e-mail",
    detail: "L'adresse du compte Apple ou Google transmise lors de la connexion.",
  },
  {
    label: "Nom",
    detail:
      "Le nom transmis par le fournisseur de connexion ; il sert uniquement à proposer un pseudo par défaut.",
  },
  {
    label: "Identifiant utilisateur",
    detail:
      "L'identifiant du compte chez Supabase, également utilisé comme identifiant client chez RevenueCat.",
  },
  {
    label: "Identifiant d'appareil",
    detail:
      "Un identifiant aléatoire (UUID) créé à l'installation de l'application, qui rattache les statistiques de jeu à leur point de départ. Ce n'est jamais un identifiant matériel.",
  },
  {
    label: "Historique d'achat",
    detail: "L'état de l'abonnement Mentis Premium, transmis par RevenueCat.",
  },
  {
    label: "Contenu de jeu",
    detail:
      "Le pseudo, les scores, les résultats des sessions et des tentatives, ainsi que les réponses saisies en compétition.",
  },
];

const PROCESSORS = [
  {
    name: "Supabase",
    role: "Authentification et base de données",
    region: "Francfort, Union européenne",
  },
  {
    name: "Railway",
    role: "Hébergement de l'API de l'application",
    region: "EU West (Amsterdam, Pays-Bas)",
  },
  {
    name: "Vercel",
    role: "Hébergement de ce site vitrine",
    region: "Aucune donnée de compte ne lui est transmise",
  },
  {
    name: "RevenueCat",
    role: "État de l'abonnement Mentis Premium",
    region:
      "États-Unis, transfert encadré par les clauses contractuelles types de la Commission européenne",
  },
  {
    name: "Apple",
    role: "Connexion « Se connecter avec Apple » et paiement de l'abonnement",
    region: "Selon la politique de confidentialité d'Apple",
  },
  {
    name: "Google",
    role: "Connexion « Continuer avec Google » et paiement de l'abonnement",
    region: "Selon la politique de confidentialité de Google",
  },
];

const RIGHTS = [
  "Droit d'accès : obtenir la liste des données liées à votre compte.",
  "Droit de rectification : corriger une donnée inexacte, le pseudo se change dans l'application.",
  "Droit à l'effacement : supprimer le compte dans l'application ou en écrivant à l'adresse de support.",
  "Droit à la portabilité : recevoir vos données dans un format lisible par machine.",
  "Droit d'opposition : vous opposer à un traitement pour un motif tenant à votre situation.",
];

export const metadata: Metadata = {
  title: "Politique de confidentialité — Mentis",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-16 px-6 py-24">
      <section className="flex flex-col gap-6">
        <h1 className="text-4xl">Politique de confidentialité</h1>
        <p className="text-lg text-zinc-600">
          Comment l'application Mentis traite les données de ses joueurs.
        </p>
        <p className="text-sm text-zinc-500">Dernière mise à jour : {LAST_UPDATED}</p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Responsable du traitement</h2>
        <p className="text-sm text-zinc-600">
          {PUBLISHER.firstName} {PUBLISHER.lastName}, {PUBLISHER.legalStatus.toLowerCase()} exerçant
          sous le nom commercial « {PUBLISHER.tradeName} », {PUBLISHER.address}. Pour toute question
          ou toute demande relative à vos données :{" "}
          <a href={`mailto:${PUBLISHER.email}`} className="text-sky-600 hover:underline">
            {PUBLISHER.email}
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Jouer sans compte ne collecte rien</h2>
        <p className="text-sm text-zinc-600">
          Mentis se joue sans compte. Dans ce cas, aucune donnée personnelle n'est collectée : les
          statistiques de jeu restent sur l'appareil et ne sont transmises que si vous créez un
          compte et acceptez explicitement de les transférer vers lui.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Données collectées avec un compte</h2>
        <p className="text-sm text-zinc-600">
          Toutes les données ci-dessous sont liées à votre compte et servent uniquement au
          fonctionnement de l'application. Aucune n'est utilisée à des fins de suivi publicitaire,
          vendue ou partagée à des fins commerciales.
        </p>
        <dl className="flex flex-col gap-4 text-sm">
          {COLLECTED_DATA.map((data) => (
            <div key={data.label} className="flex flex-col gap-1">
              <dt className="text-zinc-900">{data.label}</dt>
              <dd className="text-zinc-600">{data.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Ni mesure d'audience, ni publicité</h2>
        <p className="text-sm text-zinc-600">
          Mentis n'intègre aucun outil de mesure d'audience, aucun rapport de plantage automatique
          et aucune régie publicitaire. L'application ne suit pas ses joueurs entre applications ou
          sites, et ne demande donc jamais d'autorisation de suivi.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Sous-traitants et transferts</h2>
        <p className="text-sm text-zinc-600">
          Les prestataires suivants traitent des données pour le compte de Mentis, chacun dans son
          rôle. Aucune donnée ne quitte l'Union européenne, à la seule exception de RevenueCat.
        </p>
        <dl className="flex flex-col gap-4 text-sm">
          {PROCESSORS.map((processor) => (
            <div key={processor.name} className="flex flex-col gap-1">
              <dt className="text-zinc-900">{processor.name}</dt>
              <dd className="text-zinc-600">
                {processor.role} — {processor.region}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Conservation et suppression</h2>
        <p className="text-sm text-zinc-600">
          Les données d'un compte sont conservées tant que ce compte existe. La suppression se fait
          dans l'application, depuis l'écran Compte, bouton « Supprimer mon compte » : elle est
          immédiate, irréversible, et efface l'ensemble des données côté serveur. Rien n'est
          conservé après.
        </p>
        <p className="text-sm text-zinc-600">
          Le classement public affiche uniquement le pseudo et les totaux de la saison, y compris
          aux visiteurs non connectés.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Vos droits</h2>
        <ul className="flex flex-col gap-3 text-sm text-zinc-600">
          {RIGHTS.map((right) => (
            <li key={right}>{right}</li>
          ))}
        </ul>
        <p className="text-sm text-zinc-600">
          Ces droits s'exercent dans l'application ou en écrivant à{" "}
          <a href={`mailto:${PUBLISHER.email}`} className="text-sky-600 hover:underline">
            {PUBLISHER.email}
          </a>
          . Si une réponse ne vous satisfait pas, vous pouvez adresser une réclamation à la
          Commission nationale de l'informatique et des libertés (CNIL),{" "}
          <a href="https://www.cnil.fr" className="text-sky-600 hover:underline">
            www.cnil.fr
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg">Âge des joueurs</h2>
        <p className="text-sm text-zinc-600">
          Jouer sans compte n'est soumis à aucune condition d'âge. La création d'un compte est
          réservée aux personnes de 15 ans ou plus ; en dessous de cet âge, elle requiert
          l'autorisation du titulaire de l'autorité parentale.
        </p>
      </section>
    </main>
  );
}
