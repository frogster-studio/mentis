export const HOME_TAB_LABEL = "Accueil";
export const PLAY_LABEL = "Commencer";
export const SESSION_COUNT_SINGULAR = "partie";
export const SESSION_COUNT_PLURAL = "parties";
export const PICKER_TITLE = "Choisis un thème";
export const PICKER_ERROR = "Impossible de charger les thèmes.";
export const PICKER_BACK_LABEL = "Retour";
export const SESSION_ERROR = "Impossible de charger les questions.";
export const ANSWER_PLACEHOLDER = "Ta réponse…";
export const CONFIRM_LABEL = "Valider";
export const SQUARE_SWITCH_LABEL = "Passer en Carré";
export const RESULTS_HOME_LABEL = "Retour à l'accueil";
export const RESULTS_REPLAY_LABEL = "Rejouer, même thème";
export const RESULTS_NO_ANSWER = "Aucune réponse";
export const RESULTS_CANONICAL_LABEL = "Réponse exacte :";
export const QUIT_LABEL = "Quitter la partie";
export const QUIT_TITLE = "Quitter la partie ?";
export const QUIT_MESSAGE =
  "Ta progression sera perdue. Cette partie ne sera pas comptée dans tes statistiques.";
export const QUIT_CANCEL_LABEL = "Ne pas quitter";
export const QUIT_CONFIRM_LABEL = "Oui, quitter";

export const DRAW_SIZE = 10;
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
export const RESULTS_SCORE_MAX_LABEL = `sur ${MAX_SESSION_SCORE}`;

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
