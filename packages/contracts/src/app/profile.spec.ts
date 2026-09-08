import { describe, expect, it } from "vitest";
import { appProfileResponseSchema, appPseudoInputSchema, appPseudoSchema } from "./index";

describe("appPseudoSchema", () => {
  it.each(["abc", "A".repeat(20), "123", "_Ab", "___", "JeanPierre07731"])(
    "accepts %s without changing its casing",
    (pseudo) => {
      expect(appPseudoSchema.parse(pseudo)).toBe(pseudo);
    },
  );

  it.each(["ab", "a".repeat(21), "a b", "Éléonore", "Jean-Pierre", "abc\n", "abc ", " abc"])(
    "rejects %j",
    (pseudo) => {
      expect(appPseudoSchema.safeParse(pseudo).success).toBe(false);
    },
  );
});

describe.each([
  ["appProfileResponseSchema", appProfileResponseSchema],
  ["appPseudoInputSchema", appPseudoInputSchema],
])("%s", (_name, schema) => {
  it("requires a valid string pseudo", () => {
    expect(schema.parse({ pseudo: "Player_42" })).toEqual({ pseudo: "Player_42" });
    for (const value of [null, {}, { pseudo: null }, { pseudo: 123 }, { pseudo: "ab" }]) {
      expect(schema.safeParse(value).success).toBe(false);
    }
  });

  it("strips ownership and storage fields", () => {
    expect(
      schema.parse({ pseudo: "Player_42", owner: "another-account", pseudoKey: "player_42" }),
    ).toEqual({ pseudo: "Player_42" });
  });
});
