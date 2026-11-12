import { describe, expect, it } from "vitest";
import { anecdoteImageOverlaySize } from "@/features/anecdote/image-overlay-size";
import { GUTTER, MAX_CONTENT_WIDTH } from "@/theme/tokens";

describe("anecdoteImageOverlaySize", () => {
  it("spans a phone's width minus the gutters, at 750:1024", () => {
    const size = anecdoteImageOverlaySize({ width: 390, height: 844 });

    expect(size.width).toBe(390 - 2 * GUTTER);
    expect(size.height).toBeCloseTo(((390 - 2 * GUTTER) * 1024) / 750);
  });

  it("shrinks to the height of a short landscape window, minus the gutters", () => {
    const size = anecdoteImageOverlaySize({ width: 844, height: 390 });

    expect(size.height).toBeCloseTo(390 - 2 * GUTTER);
    expect(size.width).toBeCloseTo(((390 - 2 * GUTTER) * 750) / 1024);
  });

  it("caps a wide web window at the content width", () => {
    const size = anecdoteImageOverlaySize({ width: 1440, height: 1200 });

    expect(size.width).toBe(MAX_CONTENT_WIDTH);
    expect(size.height).toBeCloseTo((MAX_CONTENT_WIDTH * 1024) / 750);
  });
});
