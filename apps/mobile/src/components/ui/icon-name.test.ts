import { describe, expect, it } from "vitest";
import { FALLBACK_ICON_NAME, iconNameOrFallback } from "./icon-name";

describe("iconNameOrFallback", () => {
  it("keeps a glyph the icon set knows", () => {
    expect(iconNameOrFallback("park")).toBe("park");
  });

  it("falls back to the neutral glyph on an unknown name", () => {
    expect(iconNameOrFallback("prak")).toBe(FALLBACK_ICON_NAME);
    expect(iconNameOrFallback("")).toBe(FALLBACK_ICON_NAME);
    expect(iconNameOrFallback("toString")).toBe(FALLBACK_ICON_NAME);
  });

  it("resolves its own fallback, so the neutral glyph is a real one", () => {
    expect(iconNameOrFallback(FALLBACK_ICON_NAME)).toBe(FALLBACK_ICON_NAME);
  });
});
