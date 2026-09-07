import { appPseudoSchema } from "@mentis/contracts/app";

// The contract's own schema, so the Sheet can never disagree with the 400 the API would answer.
export function isValidPseudo(value: string): boolean {
  return appPseudoSchema.safeParse(value).success;
}
