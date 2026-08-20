// Normalize → exact match → bounded Levenshtein (never over Misspellings); mobile ADR 0001.

export type MatchableQuestion = {
  answer: string;
  aliases: string[];
  misspellings: string[];
};

// « le/la/les/l'/un/une/des » — after punctuation stripping, « l' » surfaces as a bare « l » token.
const LEADING_ARTICLES = new Set(["le", "la", "les", "l", "un", "une", "des"]);

export function matchAnswer(input: string, question: MatchableQuestion): boolean {
  const normalizedInput = normalize(input);
  if (normalizedInput === "") {
    return false;
  }

  const exactTargets = [question.answer, ...question.aliases, ...question.misspellings];
  if (exactTargets.some((target) => normalize(target) === normalizedInput)) {
    return true;
  }

  const fuzzyTargets = [question.answer, ...question.aliases];
  return fuzzyTargets.some((target) => withinTypoTolerance(normalizedInput, normalize(target)));
}

function normalize(raw: string): string {
  const folded = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const words = folded.split(" ");
  // Strip a leading article only when something remains: « Dés » must not normalize to empty.
  if (words.length > 1 && LEADING_ARTICLES.has(words[0])) {
    words.shift();
  }
  return words.join(" ");
}

function withinTypoTolerance(input: string, target: string): boolean {
  if (target === "") {
    return false;
  }
  // Purely numeric answers (years, counts) get zero tolerance — the exact stage already ran.
  if (isPurelyNumeric(input) || isPurelyNumeric(target)) {
    return false;
  }
  const maxEdits = maxEditsFor(Math.min(input.length, target.length));
  if (maxEdits === 0) {
    return false;
  }
  return withinEditDistance(input, target, maxEdits);
}

function isPurelyNumeric(value: string): boolean {
  return /^[0-9 ]+$/.test(value);
}

// Fixed product thresholds; the shorter side decides the tier, so ≤3 chars never fuzz-match.
function maxEditsFor(length: number): number {
  if (length <= 3) {
    return 0;
  }
  if (length <= 6) {
    return 1;
  }
  if (length <= 10) {
    return 2;
  }
  return 3;
}

function withinEditDistance(a: string, b: string, maxEdits: number): boolean {
  if (Math.abs(a.length - b.length) > maxEdits) {
    return false;
  }
  let previousRow = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const currentRow = [i];
    let rowMinimum = i;
    for (let j = 1; j <= b.length; j += 1) {
      const substitution = previousRow[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      const cost = Math.min(previousRow[j] + 1, currentRow[j - 1] + 1, substitution);
      currentRow.push(cost);
      rowMinimum = Math.min(rowMinimum, cost);
    }
    // Row minima never decrease, so the final distance already exceeds the bound.
    if (rowMinimum > maxEdits) {
      return false;
    }
    previousRow = currentRow;
  }
  return previousRow[b.length] <= maxEdits;
}
