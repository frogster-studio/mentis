// Answer Matching engine (ADR 0001, seam 1 of the PRD's testing decisions): decides
// on-device whether a Cash answer is correct. Pure TS — no React, no network, no runtime AI.
// Pipeline: normalize → exact match (Canonical Answer + Aliases + Misspellings) →
// bounded Levenshtein (Canonical Answer + Aliases only, never Misspellings).

import type { Question } from "@/types/quiz";

export type MatchableQuestion = Pick<Question, "answer" | "aliases" | "misspellings">;

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
  // Strip a leading article only when something remains: an answer that IS an
  // article-shaped word (« Dés ») must not normalize to the empty string.
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

// Length-scaled thresholds fixed by the PRD interview; the shorter side decides the tier
// so a ≤3-char string is never fuzz-matched. Tune only via failing test cases.
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
