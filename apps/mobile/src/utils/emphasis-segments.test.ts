import { describe, expect, it } from "vitest";
import { emphasisSegments } from "./emphasis-segments";

describe("emphasisSegments", () => {
  it("splits bold and italic spans from the regular text, in order, markers removed", () => {
    expect(emphasisSegments("Le **miel** ne se __périme__ jamais.")).toEqual([
      { text: "Le ", emphasis: "regular" },
      { text: "miel", emphasis: "bold" },
      { text: " ne se ", emphasis: "regular" },
      { text: "périme", emphasis: "italic" },
      { text: " jamais.", emphasis: "regular" },
    ]);
  });

  it("gives one regular segment to a text without markers", () => {
    expect(emphasisSegments("Les loutres se tiennent la main.")).toEqual([
      { text: "Les loutres se tiennent la main.", emphasis: "regular" },
    ]);
  });

  it("shows an orphan marker literally", () => {
    expect(emphasisSegments("2 ** 3 vaut 8")).toEqual([
      { text: "2 ** 3 vaut 8", emphasis: "regular" },
    ]);
    expect(emphasisSegments("__init__ et un __ seul")).toEqual([
      { text: "init", emphasis: "italic" },
      { text: " et un __ seul", emphasis: "regular" },
    ]);
  });

  it("shows the other marker literally inside a span", () => {
    expect(emphasisSegments("**un __gras__ entier**")).toEqual([
      { text: "un __gras__ entier", emphasis: "bold" },
    ]);
    expect(emphasisSegments("__un **italique** entier__")).toEqual([
      { text: "un **italique** entier", emphasis: "italic" },
    ]);
  });

  it("keeps line breaks in their segment", () => {
    expect(emphasisSegments("Première ligne\n**seconde\nligne**")).toEqual([
      { text: "Première ligne\n", emphasis: "regular" },
      { text: "seconde\nligne", emphasis: "bold" },
    ]);
  });
});
