import { describe, expect, it } from "vitest";
import { slugify } from "../utils/slugify";

describe("slugify", () => {
  it.each([
    ["Histoire", "histoire"],
    ["Télévision", "television"],
    ["Ciné & Séries", "cine-series"],
    ["  Jeux   Vidéo  ", "jeux-video"],
    ["Rock'n'Roll", "rock-n-roll"],
    ["Années 80", "annees-80"],
    ["Déjà-vu", "deja-vu"],
  ])("turns %o into %o", (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });

  it("gives one key to two names the Catalog cannot tell apart", () => {
    expect(slugify("Ciné & Séries")).toBe(slugify("Cine Series"));
  });

  it("has nothing to build a slug from when the name carries no letter or digit", () => {
    expect(slugify("!?…")).toBe("");
  });
});
