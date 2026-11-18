import { describe, expect, it } from "vitest";
import {
  ANECDOTE_IMAGE_WINDOW_INSET,
  anecdoteImageOverlaySize,
} from "@/features/anecdote/image-overlay-size";
import { MAX_CONTENT_WIDTH } from "@/theme/tokens";

describe("anecdoteImageOverlaySize", () => {
  it("spans a phone's width minus the inset, at 750:1024", () => {
    const size = anecdoteImageOverlaySize({ width: 390, height: 844 });

    expect(size.width).toBe(390 - 2 * ANECDOTE_IMAGE_WINDOW_INSET);
    expect(size.height).toBeCloseTo(((390 - 2 * ANECDOTE_IMAGE_WINDOW_INSET) * 1024) / 750);
  });

  it("shrinks to the height of a short landscape window, minus the inset", () => {
    const size = anecdoteImageOverlaySize({ width: 844, height: 390 });

    expect(size.height).toBeCloseTo(390 - 2 * ANECDOTE_IMAGE_WINDOW_INSET);
    expect(size.width).toBeCloseTo(((390 - 2 * ANECDOTE_IMAGE_WINDOW_INSET) * 750) / 1024);
  });

  it("caps a wide web window at the content width", () => {
    const size = anecdoteImageOverlaySize({ width: 1440, height: 1200 });

    expect(size.width).toBe(MAX_CONTENT_WIDTH);
    expect(size.height).toBeCloseTo((MAX_CONTENT_WIDTH * 1024) / 750);
  });
});
