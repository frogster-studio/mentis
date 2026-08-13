// Canonical domain types (see CONTEXT.md for the glossary).
//
// Where the domain shape *is* the wire shape, the type comes from `@mentis/contracts` rather than
// being restated here: the API publishes these rows, so a drift between the two would be a bug with
// two homes. Purely on-device shapes (Device Stats, outbox entries, transfer state) stay local —
// contracts never grows device-only vocabulary.

import type { AppQuestionDrawResponse, AppThemeListResponse } from "@mentis/contracts/app";

export type QuizMode = "cash" | "square";

export type ThemeWithCount = AppThemeListResponse[number];

export type Question = AppQuestionDrawResponse[number];
