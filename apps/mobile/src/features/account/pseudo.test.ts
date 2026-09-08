import { describe, expect, it } from "vitest";
import { isValidPseudo } from "./pseudo";

describe("isValidPseudo", () => {
  it("accepts three to twenty letters, digits and underscores", () => {
    for (const pseudo of ["Ana", "Eleonore48213", "12345", "a_b", "A".repeat(20)]) {
      expect(isValidPseudo(pseudo)).toBe(true);
    }
  });

  it("refuses anything shorter than three or longer than twenty characters", () => {
    expect(isValidPseudo("")).toBe(false);
    expect(isValidPseudo("Al")).toBe(false);
    expect(isValidPseudo("A".repeat(21))).toBe(false);
  });

  it("refuses a space, an accent and a hyphen", () => {
    for (const pseudo of ["Jean Pierre", "Éléonore", "Jean-Pierre"]) {
      expect(isValidPseudo(pseudo)).toBe(false);
    }
  });
});
