import type { Metadata } from "next";
import localFont from "next/font/local";
import Image from "next/image";

import { LogoWordmark } from "@/features/mentis/logo-wordmark";
import styles from "@/features/mentis/mentis.module.css";
import { CompetitionArt, ProductArt } from "@/features/mentis/product-art";
import { QuizDemo } from "@/features/mentis/quiz-demo";
import { WAITLIST_CTA } from "@/features/mentis/waitlist-config";
import { WaitlistForm } from "@/features/mentis/waitlist-form";
import { PUBLISHER } from "@/lib/publisher";
import { ROUTES } from "@/lib/routes";

const epunda = localFont({
  src: "../../../public/fonts/mentis/epunda-slab-variable.ttf",
  variable: "--font-mentis-heading",
  weight: "500",
  display: "swap",
});
const inter = localFont({
  src: "../../../../mobile/assets/fonts/InterTight-Regular.ttf",
  variable: "--font-mentis-body",
  weight: "400",
  display: "swap",
});

const TITLE = "Mentis — La culture générale, à toi de jouer";
const DESCRIPTION =
  "Des thèmes à explorer, 25 secondes pour répondre Cash ou Carré. Découvre Mentis et candidate à la bêta iOS et Android. Premium offert aux testeurs sélectionnés pendant la bêta.";
const URL = "https://frogster-studio.com/mentis";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  icons: {
    icon: [
      { url: "/mentis/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/mentis/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [{ url: "/mentis/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: URL,
    siteName: "Mentis",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: `${URL}/social-preview.png`,
        width: 1200,
        height: 630,
        alt: "Mentis — La culture générale, à toi de jouer. Bêta iOS et Android.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${URL}/social-preview.png`],
  },
};

export default function MentisPage() {
  return (
    <div className={`${styles.landing} ${epunda.variable} ${inter.variable}`}>
      <div className={styles.container}>
        <header className={styles.header}>
          <a href={ROUTES.mentis} aria-label="Mentis — accueil" className={styles.brand}>
            <Image
              src="/mentis/logo.svg"
              alt=""
              className={styles.mark}
              width={200}
              height={196}
              unoptimized
            />
            <LogoWordmark className={styles.wordmark} />
          </a>
          <nav aria-label="Navigation Mentis" className={styles.nav}>
            <a href="#experience" className={styles.navLink}>
              Le principe
            </a>
            <a href="#essayer" className={styles.navLink}>
              À toi de jouer
            </a>
            <a href="#beta" className={styles.navCta}>
              {WAITLIST_CTA}
            </a>
          </nav>
        </header>
        <main>
          <section className={styles.hero} aria-labelledby="hero-title">
            <div>
              <h1 id="hero-title">
                La culture générale,
                <br />à toi de jouer.
              </h1>
              <p className={styles.heroDescription}>
                Choisis un thème, réponds Cash ou passe en Carré. Dix questions pour tester ce que
                tu sais et découvrir ce qui t’échappe.
              </p>
              <a href="#beta" className={`${styles.button} ${styles.primary}`}>
                {WAITLIST_CTA}
                <span aria-hidden="true">↗</span>
              </a>
              <p className={styles.heroDetails}>
                <span>Accès limité, invitations progressives.</span>Premium offert aux testeurs
                sélectionnés pendant la bêta.
              </p>
            </div>
            <ProductArt />
          </section>
          <div className={styles.rule}>
            <span>
              <b>10</b> questions par partie
            </span>
            <span>
              <b>25</b> secondes pour répondre
            </span>
            <span>
              <b>2</b> façons de jouer
            </span>
          </div>
          <section className={styles.section} id="experience" aria-labelledby="experience-title">
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.kicker}>01 / Le principe</span>
                <h2 id="experience-title">
                  Une bonne dose
                  <br />
                  de curiosité.
                </h2>
              </div>
              <p>
                Un thème qui t’intrigue, une réponse au bout de la langue… et le plaisir de savoir,
                même quand tu te trompes.
              </p>
            </div>
            <div className={styles.steps}>
              <article className={styles.step}>
                <span className={styles.stepNumber}>01</span>
                <h3>Suis ta curiosité.</h3>
                <p>
                  Choisis un thème parmi ceux proposés. Histoire, nature, sciences, sport : il y a
                  toujours un nouveau terrain à explorer.
                </p>
              </article>
              <article className={styles.step}>
                <span className={styles.stepNumber}>02</span>
                <h3>Cash ou Carré ?</h3>
                <p>
                  Tu connais la réponse ? Écris-la en Cash pour 5 points. Un doute ? Révèle les
                  quatre propositions du Carré pour 2 points. Le chrono continue.
                </p>
              </article>
              <article className={styles.step}>
                <span className={styles.stepNumber}>03</span>
                <h3>Repars avec plus.</h3>
                <p>
                  Au bout des dix questions, découvre ton score et les bonnes réponses. Retrouve tes
                  moyennes par thème, puis rejoue pour les améliorer.
                </p>
              </article>
            </div>
          </section>
          <section className={styles.demoSection} id="essayer" aria-labelledby="demo-title">
            <div className={styles.demoCopy}>
              <Image
                className={styles.wink}
                src="/mentis/wink.webp"
                alt=""
                width={85}
                height={122}
                unoptimized
              />
              <span className={styles.kicker}>02 / Petit test surprise</span>
              <h2 id="demo-title">
                On parie que
                <br />
                tu as une idée ?
              </h2>
              <p>
                Voici un aperçu du mode Carré. Dans l’app, tu commences en Cash et tu choisis de
                révéler les propositions si tu en as besoin.
              </p>
              <div className={styles.modeNotes}>
                <span>
                  <b>Cash · 5 pts</b>Tu écris la réponse.
                </span>
                <span>
                  <b>Carré · 2 pts</b>Tu choisis parmi quatre.
                </span>
              </div>
            </div>
            <QuizDemo />
          </section>
          <section
            className={`${styles.section} ${styles.competition}`}
            aria-labelledby="competition-title"
          >
            <CompetitionArt />
            <div className={styles.sectionCopy}>
              <span className={styles.kicker}>03 / Envie de compétition ?</span>
              <h2 id="competition-title">
                Un rendez-vous par jour.
                <br />
                Un sommet à viser.
              </h2>
              <p>
                Retrouve la compétition quotidienne : un thème tiré au sort, dix questions, et tes
                points qui comptent au classement de la saison.
              </p>
              <p className={styles.smallPrint}>
                En solo, tu peux t’entraîner sans compte. Pour rejoindre le classement, crée ton
                compte et choisis ton pseudo.
              </p>
            </div>
          </section>
          <section className={styles.beta} id="beta" aria-labelledby="beta-title">
            <div className={styles.betaIntro}>
              <span className={styles.kicker}>04 / Fais partie des premiers</span>
              <h2 id="beta-title">
                La suite s’écrit
                <br />
                avec toi.
              </h2>
              <p>
                Mentis est encore en développement et n’est pas disponible au public. Nous ouvrons
                progressivement la bêta à des testeurs sur iOS et Android.
              </p>
              <div className={styles.premiumNote}>
                <Image src="/mentis/crown.webp" alt="" width={76} height={70} unoptimized />
                <p>
                  <span>Premium offert pendant la bêta.</span>Certaines fonctionnalités sont
                  Premium, comme rejouer la compétition du jour ou rattraper celle de la veille. Les
                  testeurs sélectionnés y auront accès gratuitement pendant la bêta.
                </p>
              </div>
              <div className={styles.storeNotice}>
                <p>
                  <strong>La bonne adresse e-mail, c’est important.</strong>
                </p>
                <p>
                  Sur Android, indique l’adresse du compte Google que tu utilises sur le Google Play
                  Store. Sur iOS, indique l’adresse de ton compte Apple.
                </p>
                <p>
                  Une adresse différente peut empêcher l’accès à la bêta. Ne communique jamais ton
                  mot de passe.
                </p>
              </div>
              <details className={styles.privacyNotice}>
                <summary>Tes données, uniquement pour la bêta</summary>
                <p>
                  {PUBLISHER.firstName} {PUBLISHER.lastName} ({PUBLISHER.tradeName}) utilise tes
                  nom, prénom, e-mail et système mobile, avec ton consentement, pour gérer ta
                  candidature et te contacter au sujet de l’accès à la bêta.
                </p>
                <p>
                  Les réponses sont hébergées en Europe par Tally, notre prestataire de formulaire.
                  Elles sont conservées jusqu’à la fin de la bêta, puis supprimées. Elles ne servent
                  pas à t’inscrire à une newsletter.
                </p>
                <p>
                  Tu peux retirer ton consentement ou demander l’accès, la rectification et la
                  suppression de tes données à{" "}
                  <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a>. Retirer ton
                  consentement met fin à ta candidature. Tu peux aussi adresser une réclamation à la
                  CNIL.
                </p>
                <p>
                  <a href={ROUTES.privacy}>Politique de confidentialité de Mentis</a> ·{" "}
                  <a href="https://tally.so/help/privacy-policy" target="_blank" rel="noreferrer">
                    Confidentialité de Tally
                  </a>
                </p>
              </details>
            </div>
            <WaitlistForm />
          </section>
          <div className={styles.finalLine}>
            <p>La curiosité n’attend que toi.</p>
            <a className={`${styles.button} ${styles.primary}`} href="#beta">
              {WAITLIST_CTA}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </main>
        <div className={styles.footerBrand}>
          <LogoWordmark className={styles.wordmark} />
          <span>Une app imaginée par Frogster Studio.</span>
        </div>
      </div>
    </div>
  );
}
