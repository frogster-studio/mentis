import { appPseudoSchema } from "@mentis/contracts/app";
import { describe, expect, it } from "vitest";
import { defaultPseudo, pseudoKey } from "../utils/pseudo";

const digits = (drawn: number) => () => drawn;

describe("defaultPseudo", () => {
  it("keeps the first word alone, stripped of its diacritics", () => {
    expect(defaultPseudo("Éléonore Dupont", digits(48213))).toBe("Eleonore48213");
  });

  it("drops every character outside the pseudo alphabet", () => {
    expect(defaultPseudo("Jean-Pierre", digits(7731))).toBe("JeanPierre07731");
  });

  it("truncates the name to fifteen characters before the digits", () => {
    expect(defaultPseudo("Maximilien-Alexandre", digits(48213))).toBe("MaximilienAlexa48213");
  });

  it("keeps the digits and underscores a name already carries", () => {
    expect(defaultPseudo("anna_2 Leroy", digits(48213))).toBe("anna_248213");
  });

  it("falls back to Joueur without a usable name", () => {
    expect(defaultPseudo(undefined, digits(55020))).toBe("Joueur55020");
    expect(defaultPseudo("   ", digits(55020))).toBe("Joueur55020");
    expect(defaultPseudo("!?", digits(55020))).toBe("Joueur55020");
  });

  it("zero-pads the draw to five digits", () => {
    expect(defaultPseudo("Zoe", digits(0))).toBe("Zoe00000");
    expect(defaultPseudo("Zoe", digits(99999))).toBe("Zoe99999");
  });

  it("always derives a pseudo the contract accepts", () => {
    const names = [undefined, "", "   ", "!?", "Éléonore Dupont", "Jean-Pierre", "李", "Zoé"];
    for (const name of names) {
      for (const drawn of [0, 7731, 48213, 99999]) {
        expect(appPseudoSchema.safeParse(defaultPseudo(name, digits(drawn))).success).toBe(true);
      }
    }
  });
});

describe("pseudoKey", () => {
  it("lowercases and nothing else", () => {
    expect(pseudoKey("Eleonore48213")).toBe("eleonore48213");
    expect(pseudoKey("Jean_Pierre")).toBe("jean_pierre");
    expect(pseudoKey("48213")).toBe("48213");
  });

  it("collapses the casings of one pseudo onto one key", () => {
    expect(pseudoKey("ELEONORE")).toBe(pseudoKey("eleonore"));
  });
});
