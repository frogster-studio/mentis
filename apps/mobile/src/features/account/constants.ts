// French UI copy for the Account surface (« Compte » screen, sign-in, sign-out). The Apple
// button's own label is supplied and localized by the OS (the native Apple button renders
// « Continuer avec Apple » on a French device), so it is not defined here. The Google button is
// a plain app button, so its label lives here.

export const ACCOUNT_TITLE = "Compte";
export const ACCOUNT_BACK_LABEL = "Retour";
export const ACCOUNT_PITCH = "Connecte-toi pour retrouver tes statistiques sur tous tes appareils.";

export const GOOGLE_SIGN_IN_LABEL = "Continuer avec Google";

export const SIGN_OUT_LABEL = "Se déconnecter";
export const SIGN_OUT_TITLE = "Se déconnecter ?";
export const SIGN_OUT_MESSAGE = "Tes statistiques restent en sécurité sur ton compte.";
export const SIGN_OUT_CONFIRM_LABEL = "Se déconnecter";
export const SIGN_OUT_CANCEL_LABEL = "Annuler";

export const SIGN_IN_ERROR = "La connexion a échoué. Réessaie.";

// Stats Transfer prompt — offered once at sign-in when the device already holds Device Stats. It is
// a move, not a copy (the message says so), with transferring encouraged and « Plus tard » safe and
// reversible: declining keeps the stats on the device, re-offered at the next sign-in.
export const TRANSFER_TITLE = "Récupère tes statistiques";
export const TRANSFER_MESSAGE =
  "Tu as déjà des statistiques sur cet appareil. Transfère-les sur ton compte pour les retrouver sur tous tes appareils. Elles quitteront cet appareil pour vivre sur ton compte.";
export const TRANSFER_ACCEPT_LABEL = "Transférer";
export const TRANSFER_DECLINE_LABEL = "Plus tard";
export const TRANSFER_ERROR = "Le transfert a échoué. Réessaie.";

// Shown on the signed-out home once a transfer has moved the device world onto an Account: the shelf
// is empty here because the stats now live on the Account, not because nothing was ever played.
export const TRANSFER_DONE_HOME = "Tes statistiques sont maintenant sur ton compte.";

// Account deletion (« Supprimer mon compte ») — mandated by App Store guideline 5.1.1(v), and the
// GDPR erasure path. The confirmation says exactly what is erased (the Account and every saved stat)
// and that it cannot be undone; the destructive action sits on the subdued confirm button, leaving
// « Annuler » the encouraged default (ConfirmDialog).
export const DELETE_ACCOUNT_LABEL = "Supprimer mon compte";
export const DELETE_ACCOUNT_TITLE = "Supprimer ton compte ?";
export const DELETE_ACCOUNT_MESSAGE =
  "Ton compte et toutes tes statistiques enregistrées seront définitivement supprimés. Cette action est irréversible.";
export const DELETE_ACCOUNT_CONFIRM_LABEL = "Supprimer";
export const DELETE_ACCOUNT_CANCEL_LABEL = "Annuler";
export const DELETE_ACCOUNT_ERROR = "La suppression a échoué. Réessaie.";
