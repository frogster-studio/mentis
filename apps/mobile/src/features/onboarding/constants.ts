import type { OnboardingOutcome } from "@/features/onboarding/outcome";
import { POINTS_CASH, POINTS_SQUARE } from "@/features/quiz/constants";
import type { Question } from "@/types/quiz";

export const ONBOARDING_PRACTICE_CAPTION = "Practice illimité";
export const ONBOARDING_PRACTICE_TITLE = "Entraîne toi sur de nombreux thèmes";
export const ONBOARDING_COMPETITION_CAPTION = "Envie de compétition ?";
export const ONBOARDING_COMPETITION_TITLE = "Hisse toi en haut du classement";
export const ONBOARDING_LEADER_PSEUDO = "Emma8M6B";
export const ONBOARDING_LEADER_POINTS = 4500;
export const ONBOARDING_SURPRISE_CAPTION = "Passons au fonctionnement d'un quiz";
export const ONBOARDING_SURPRISE_TITLE = "Petit test surprise";
export const ONBOARDING_SURPRISE_CTA_LABEL = "C'est parti";
export const ONBOARDING_BACK_LABEL = "Page précédente";
export const ONBOARDING_NEXT_LABEL = "Page suivante";
export const ONBOARDING_PAGE_SEPARATOR = " / ";
export const END_ONBOARDING_CTA_LABEL = "C'est parti";

// Composed from the button's own label, so the sentence can never name a button that moved on.
export const LEGAL_INTRO = `En appuyant sur ${END_ONBOARDING_CTA_LABEL}, vous acceptez notre `;
export const LEGAL_PRIVACY_LABEL = "Politique de confidentialité";
export const LEGAL_CONJUNCTION = " et nos ";
export const LEGAL_TERMS_LABEL = "Conditions d'utilisation";

export const ONBOARDING_QUESTION: Question = {
  id: "onboarding",
  themeId: "onboarding",
  themeName: "Volcans",
  text: "Quel est le plus haut volcan actif du monde ?",
  answer: "L'Ojos del Salado",
  aliases: ["Ojos del Salado", "Nevado Ojos del Salado", "Nevados Ojos del Salado"],
  misspellings: [
    "ollos del salade",
    "ojos salados",
    "oyos salade",
    "ollo del salado",
    "nevado ollos salado",
  ],
  wrongChoices: ["Le Vésuve", "L'Eyjafjöll", "Piton de la Fournaise"],
};

export const ONBOARDING_HINT_CASH = "Soit tu rentres directement la réponse";
export const ONBOARDING_HINT_SQUARE = `Soit tu choisis entre ${ONBOARDING_QUESTION.wrongChoices.length + 1} propositions`;
export const ONBOARDING_HINT_CASH_POINTS = `+${POINTS_CASH} points`;
export const ONBOARDING_HINT_SQUARE_POINTS = `+${POINTS_SQUARE} points`;
export const ONBOARDING_TRY_LABEL = "Essayer";

export const END_ONBOARDING_CAPTION = "Tu as compris le fonctionnement ?";
export const END_ONBOARDING_TITLE = "Prêt à commencer ?";
export const END_ONBOARDING_OUTCOME_TITLE = {
  cash: "Bravo !",
  square: "Presque parfait !",
  wrong: "Dommage !",
  missed: "Dommage !",
} as const satisfies Record<OnboardingOutcome, string>;
export const END_ONBOARDING_SCORING_LINES = [
  { lead: "Réponse “carré”, c'est ", points: `${ONBOARDING_HINT_SQUARE_POINTS}.` },
  { lead: "En réponse “cash”, c'est ", points: `${ONBOARDING_HINT_CASH_POINTS}.` },
] as const;
