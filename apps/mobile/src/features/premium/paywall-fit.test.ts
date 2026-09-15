import { describe, expect, it } from "vitest";
import { FULL_PAYWALL, fullPaywallHeight, paywallFit } from "./paywall-fit";

const SAVINGS = { illustration: 150, crest: 110 };

describe("paywallFit", () => {
  it("shows everything when the full paywall fits", () => {
    expect(paywallFit(800, 800, SAVINGS)).toEqual(FULL_PAYWALL);
  });

  it("drops the illustration first", () => {
    expect(paywallFit(900, 750, SAVINGS)).toEqual({
      showsIllustration: false,
      showsCrest: true,
      isScrollable: false,
    });
  });

  it("drops the crest once the illustration alone is not enough", () => {
    expect(paywallFit(900, 640, SAVINGS)).toEqual({
      showsIllustration: false,
      showsCrest: false,
      isScrollable: false,
    });
  });

  it("scrolls only when nothing left to drop makes it fit", () => {
    expect(paywallFit(900, 639, SAVINGS)).toEqual({
      showsIllustration: false,
      showsCrest: false,
      isScrollable: true,
    });
  });
});

describe("fullPaywallHeight", () => {
  it("adds back the parts the current fit hides, so the fit is stable", () => {
    const fit = paywallFit(900, 700, SAVINGS);
    const rendered = 900 - SAVINGS.illustration - SAVINGS.crest;
    expect(fullPaywallHeight(rendered, fit, SAVINGS)).toBe(900);
    expect(paywallFit(fullPaywallHeight(rendered, fit, SAVINGS), 700, SAVINGS)).toEqual(fit);
  });
});
