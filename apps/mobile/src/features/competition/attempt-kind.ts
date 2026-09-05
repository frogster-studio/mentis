import {
  type AppCompetitionAttemptKind,
  appCompetitionIssueInputSchema,
} from "@mentis/contracts/app";

// The route param is free text: anything but a known kind plays today's initial Attempt.
export function attemptKindFromParam(
  value: string | string[] | undefined,
): AppCompetitionAttemptKind {
  const parsed = appCompetitionIssueInputSchema.safeParse({ kind: value });
  return parsed.success ? parsed.data.kind : "initial";
}
