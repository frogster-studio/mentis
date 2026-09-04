import type { CommunityIconName } from "@/components/ui/icon-name";

export const HOME_TAB_LABEL = "Practice";
export const SESSION_COUNT_SINGULAR = "partie";
export const SESSION_COUNT_PLURAL = "parties";
export const PICKER_TITLE = "Sur quel thème ?";
export const PICKER_ERROR = "Impossible de charger les thèmes.";
export const PICKER_BACK_LABEL = "Retour";
export const PICKER_SWIPE_LABEL = "Swipe pour lancer le quiz";
export const PICKER_START_LABEL = "Lancer le quiz";
export const SESSION_ERROR = "Impossible de charger les questions.";
export const ANSWER_PLACEHOLDER = "Ta réponse…";
export const CONFIRM_LABEL = "Valider ma réponse";
export const SQUARE_SWITCH_LABEL = "Passer en Carré";
export const RESULTS_TITLE = "Résultats";
export const RESULTS_HOME_LABEL = "Retourner à l'accueil";
export const RESULTS_REPLAY_LABEL = "Rejouer";
export const RESULTS_NO_ANSWER = "Aucune réponse";
export const RESULTS_CANONICAL_LABEL = "Réponse :";
export const RESULTS_ANSWER_LABEL = "Votre réponse :";
export const QUIT_LABEL = "Quitter la partie";
export const QUIT_TITLE = "Quitter la partie ?";
export const QUIT_MESSAGE =
  "Ta progression sera perdue. Cette partie ne sera pas comptée dans tes statistiques.";
export const QUIT_CANCEL_LABEL = "Ne pas quitter";
export const QUIT_CONFIRM_LABEL = "Oui, quitter";

export const DRAW_SIZE = 7;
export const MIN_QUESTIONS_PER_THEME = 10;
export const COUNTDOWN_DURATION_MS = 25_000;
export const COUNTDOWN_TICK_MS = 100;
export const COUNTDOWN_DANGER_SECONDS = 10;
export const THEME_REVEAL_DURATION_MS = 3_000;
export const THEME_REVEAL_TICK_MS = 1_000;
export const POINTS_CASH = 5;
export const POINTS_SQUARE = 2;
export const QUESTIONS_PER_SESSION = 10;
export const COUNTDOWN_DURATION_SECONDS = COUNTDOWN_DURATION_MS / 1000;
// The score ceiling a Theme Average is measured against on the home shelf.
export const MAX_SESSION_SCORE = POINTS_CASH * QUESTIONS_PER_SESSION;
export const RESULTS_SCORE_MAX_LABEL = `/${MAX_SESSION_SCORE}`;

// Composed from the rule constants, so a rules change can never leave the explainer lying.
export const HOME_EMPTY_TITLE = "Comment ça marche ?";
export const HOME_EMPTY_SETUP = `${QUESTIONS_PER_SESSION} questions de ${COUNTDOWN_DURATION_SECONDS} secondes`;
export const HOME_EMPTY_SWITCH = "tu peux passer en Carré, sans retour";
export const HOME_EMPTY_OUTCOME = `Ton score sur ${MAX_SESSION_SCORE} en fin de partie`;
export const CASH_MODE_NAME = "Cash";
export const CASH_MODE_HOW = "tu écris la réponse, sans indice";
export const SQUARE_MODE_NAME = "Carré";
export const SQUARE_MODE_HOW = "4 propositions, tu tapes la bonne";
export const POINTS_UNIT = "pts";

export const HOME_TITLE = "Un peu d'entrainement ?";
export const PRACTICE_TITLE = "Lancer un practice";
// Composed from the rule constants, so a rules change can never leave the picker lying.
export const PICKER_SUBTITLE = `${DRAW_SIZE} thèmes au hasard · ${QUESTIONS_PER_SESSION} questions · ${COUNTDOWN_DURATION_SECONDS} s / question`;
export const PRACTICE_CTA_LABEL = "Choisir mon thème";
// Composed from the rule constants, so a rules change can never leave the pitch lying.
export const PRACTICE_PITCH = [
  { text: "1 thème", strong: true },
  { text: ` parmi ${DRAW_SIZE} choisis au hasard, `, strong: false },
  { text: `${QUESTIONS_PER_SESSION} questions`, strong: true },
  { text: " et ", strong: false },
  { text: `${COUNTDOWN_DURATION_SECONDS} secondes`, strong: true },
  { text: " pour y répondre.", strong: false },
] as const;

// Placeholders until the Categories themselves are drawn — the row only has to read as variety.
export const PRACTICE_PILL_ICONS = [
  "bug-outline",
  "account-supervisor-outline",
  "airballoon-outline",
  "alien-outline",
  "arm-flex-outline",
  "atom",
  "baby-bottle-outline",
  "bacteria-outline",
  "bag-suitcase-outline",
  "bicycle",
  "book-open-variant-outline",
  "pine-tree-variant-outline",
] as const satisfies CommunityIconName[];
