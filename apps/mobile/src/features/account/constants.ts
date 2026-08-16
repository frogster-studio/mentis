// The Apple button's label is supplied and localized by the OS, so only Google's lives here.

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

// A move, not a copy — declining keeps the stats on the device, re-offered at the next sign-in.
export const TRANSFER_TITLE = "Récupère tes statistiques";
export const TRANSFER_MESSAGE =
  "Tu as déjà des statistiques sur cet appareil. Transfère-les sur ton compte pour les retrouver sur tous tes appareils. Elles quitteront cet appareil pour vivre sur ton compte.";
export const TRANSFER_ACCEPT_LABEL = "Transférer";
export const TRANSFER_DECLINE_LABEL = "Plus tard";
export const TRANSFER_ERROR = "Le transfert a échoué. Réessaie.";

// The shelf is empty because the stats moved to the Account, not because nothing was played.
export const TRANSFER_DONE_HOME = "Tes statistiques sont maintenant sur ton compte.";

// App Store 5.1.1(v) / GDPR: the confirmation names what is erased and that it cannot be undone.
export const DELETE_ACCOUNT_LABEL = "Supprimer mon compte";
export const DELETE_ACCOUNT_TITLE = "Supprimer ton compte ?";
export const DELETE_ACCOUNT_MESSAGE =
  "Ton compte et toutes tes statistiques enregistrées seront définitivement supprimés. Cette action est irréversible.";
export const DELETE_ACCOUNT_CONFIRM_LABEL = "Supprimer";
export const DELETE_ACCOUNT_CANCEL_LABEL = "Annuler";
export const DELETE_ACCOUNT_ERROR = "La suppression a échoué. Réessaie.";
