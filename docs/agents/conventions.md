# Conventions

House rules for code style and repo hygiene. Grows one entry at a time.

## Adding a rule

Whenever a session settles a new convention — architecture, naming, code style, anything
that should hold going forward — propose adding it here: sketch the rule, wait for the
user to approve, edit, or reject it. Never write to this file without that sign-off.

## Comments

Default: none — prefer a longer, precise name over a comment. Write one only when the
code's reason for existing isn't obvious from reading it (business-logic "why"), never to
explain what changed or why it used to be different — that's `docs/adr/` territory, not a
comment. One short sentence max; never multi-line. The rule binds file headers exactly as
it binds inline comments — a multi-line header block is the same violation.

## Shared vocabularies

A closed set of values is an enum in `packages/contracts/src/enums/`, never a union of string
literals: one enum per file, named `*Enum` in a `*.enum.ts` file, keys and values UPPERCASE,
imported by every app and package rather than re-declared or re-spelled.

```ts
// ✅ packages/contracts/src/enums/quiz-answer-mode.enum.ts
export enum QuizAnswerModeEnum { CASH = "CASH", SQUARE = "SQUARE", NONE = "NONE" }

// ❌ export type MatchedVia = "canonical" | "alias" | "misspelling" | "fuzzy";
```
