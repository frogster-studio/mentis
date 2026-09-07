const PSEUDO_NAME_LENGTH = 15;
const PSEUDO_DIGIT_COUNT = 5;
const PSEUDO_FALLBACK_NAME = "Joueur";

export const pseudoKey = (pseudo: string): string => pseudo.toLowerCase();

export const defaultPseudo = (fullName: string | undefined, drawDigits: () => number): string => {
  const [firstWord = ""] = (fullName ?? "").trim().split(/\s+/);
  const name = firstWord
    .normalize("NFD")
    .replace(/[^A-Za-z0-9_]/g, "")
    .slice(0, PSEUDO_NAME_LENGTH);
  const digits = String(drawDigits()).padStart(PSEUDO_DIGIT_COUNT, "0");
  return `${name || PSEUDO_FALLBACK_NAME}${digits}`;
};
