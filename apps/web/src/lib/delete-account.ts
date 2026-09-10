export const IN_APP_STEPS = [
  "Ouvrez Mentis.",
  "Appuyez sur le bouton de menu, en haut à droite de l'en-tête.",
  "Ouvrez l'écran « Compte ».",
  "Appuyez sur « Supprimer mon compte ».",
  "Confirmez avec « Supprimer ».",
] as const;

export const DELETION_EMAIL_SUBJECT = "Demande de suppression de mon compte Mentis";

// The reviewer checks the template field by field: each line stays a line of the body.
export const DELETION_EMAIL_BODY_LINES = [
  "Bonjour,",
  "Je demande la suppression définitive de mon compte Mentis et de toutes les données associées.",
  "- Email du compte : …",
  "- Pseudo : …",
  "- Méthode de connexion : Google / Apple / Je ne sais plus",
  "Merci de me confirmer la suppression une fois effectuée.",
] as const;

export const DELETION_EMAIL_BODY = DELETION_EMAIL_BODY_LINES.join("\n");

export function buildDeletionMailto(address: string): string {
  const subject = encodeURIComponent(DELETION_EMAIL_SUBJECT);
  const body = encodeURIComponent(DELETION_EMAIL_BODY);
  return `mailto:${address}?subject=${subject}&body=${body}`;
}
