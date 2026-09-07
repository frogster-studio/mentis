import {
  type AppCompetitionAttemptKind,
  type AppCompetitionDayResponse,
  appCompetitionIssueInputSchema,
} from "@mentis/contracts/app";
import { bestAttempt } from "./best-attempt";

// The route param is free text: anything but a known kind plays today's initial Attempt.
export function attemptKindFromParam(
  value: string | string[] | undefined,
): AppCompetitionAttemptKind {
  const parsed = appCompetitionIssueInputSchema.safeParse({ kind: value });
  return parsed.success ? parsed.data.kind : "initial";
}

// The card names no kind: the day's best judged Attempt opens, the initial while none is judged.
export function entryAttemptKind(
  day: AppCompetitionDayResponse | undefined,
): AppCompetitionAttemptKind {
  return day === undefined ? "initial" : (bestAttempt(day.attempts)?.kind ?? "initial");
}
