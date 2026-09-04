import { describe, expect, it } from "vitest";

import { hexOf, hexOfHsv, hsvOf } from "./color";

describe("hexOf", () => {
  it.each([
    ["#6d4c41", "#6d4c41"],
    ["6d4c41", "#6d4c41"],
    ["#6D4C41", "#6d4c41"],
    ["6D4C41", "#6d4c41"],
    ["  #6d4c41 ", "#6d4c41"],
  ])("folds %o into the lowercase #rrggbb the contract stores", (typed, stored) => {
    expect(hexOf(typed)).toBe(stored);
  });

  it.each(["#6d4c4", "#6d4c411", "#abc", "brown", "", "#6d4c4g", "##6d4c41"])(
    "refuses %o",
    (typed) => {
      expect(hexOf(typed)).toBeNull();
    },
  );
});

describe("hsvOf", () => {
  it.each([
    ["#ff0000", { hue: 0, saturation: 1, value: 1 }],
    ["#00ff00", { hue: 120, saturation: 1, value: 1 }],
    ["#0000ff", { hue: 240, saturation: 1, value: 1 }],
    ["#ffffff", { hue: 0, saturation: 0, value: 1 }],
    ["#000000", { hue: 0, saturation: 0, value: 0 }],
  ])("reads %s", (hex, hsv) => {
    expect(hsvOf(hex)).toEqual(hsv);
  });

  it("reads a hex typed without its #", () => {
    expect(hsvOf("FF0000")).toEqual({ hue: 0, saturation: 1, value: 1 });
  });

  it("has nothing to say about a color that is not a hex", () => {
    expect(hsvOf("brown")).toBeNull();
  });
});

describe("hexOfHsv", () => {
  it.each(["#2e7d32", "#6d4c41", "#0ea5e9", "#ffffff", "#000000", "#ff00ff", "#123456"])(
    "round-trips %s",
    (hex) => {
      const hsv = hsvOf(hex);
      expect(hsv).not.toBeNull();
      expect(hexOfHsv(hsv as NonNullable<typeof hsv>)).toBe(hex);
    },
  );

  it("wraps a full turn of hue back to red", () => {
    expect(hexOfHsv({ hue: 360, saturation: 1, value: 1 })).toBe("#ff0000");
  });
});
