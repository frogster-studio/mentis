import { matchAnswer, squareChoices } from "@mentis/answer-matching";
import { describe, expect, it } from "vitest";

// The judge that will price competition Attempts has to resolve here, not only on the phone.
describe("@mentis/answer-matching resolves from the API workspace", () => {
  it("exposes both halves of the shared judge", () => {
    expect(matchAnswer("paris", { answer: "Paris", aliases: [], misspellings: [] })).toBe(true);
    expect(squareChoices({ answer: "Paris", wrongChoices: ["Lyon"] }, () => 0)).toStrictEqual([
      "Paris",
      "Lyon",
    ]);
  });
});
