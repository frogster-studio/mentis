import { describe, expect, it } from "vitest";

import {
  fitWithinCap,
  processThemeImage,
  THEME_IMAGE_WEBP_QUALITY,
  themeImageDimensionsError,
  themeImageFormatError,
} from "./theme-image";

describe("themeImageFormatError", () => {
  it.each(["a.png", "b.jpg", "c.jpeg", "d.webp", "PHOTO.PNG"])("accepts %s", (fileName) => {
    expect(themeImageFormatError(fileName)).toBeNull();
  });

  it.each(["a.gif", "b.tiff", "c.heic", "d.pdf", "no-extension"])(
    "refuses %s, naming what the bucket takes",
    (fileName) => {
      expect(themeImageFormatError(fileName)).toContain(".png, .jpg, .jpeg or .webp");
    },
  );
});

describe("themeImageDimensionsError", () => {
  it("accepts an image exactly at the floor", () => {
    expect(themeImageDimensionsError({ width: 1000, height: 1000 })).toBeNull();
  });

  it("refuses a width under the floor, naming both sizes", () => {
    const error = themeImageDimensionsError({ width: 999, height: 2000 });
    expect(error).toContain("999×2000px");
    expect(error).toContain("1000×1000px");
  });

  it("refuses a height under the floor", () => {
    expect(themeImageDimensionsError({ width: 2000, height: 800 })).not.toBeNull();
  });
});

describe("fitWithinCap", () => {
  it.each([
    [
      { width: 4000, height: 3000 },
      { width: 1920, height: 1440 },
    ],
    [
      { width: 3000, height: 4000 },
      { width: 1440, height: 1920 },
    ],
    [
      { width: 3001, height: 1999 },
      { width: 1920, height: 1279 },
    ],
  ])("caps %o at the longest side, aspect ratio kept", (source, capped) => {
    expect(fitWithinCap(source)).toEqual(capped);
  });

  it.each([
    { width: 1500, height: 1200 },
    { width: 1000, height: 1000 },
    { width: 1920, height: 1080 },
  ])("never upscales %o", (source) => {
    expect(fitWithinCap(source)).toEqual(source);
  });
});

describe("processThemeImage", () => {
  const encodedWebp = new Blob(["webp-bytes"], { type: "image/webp" });

  it("hands the encoder the capped dimensions and the webp quality", async () => {
    const calls: unknown[] = [];

    const blob = await processThemeImage(
      { image: "bitmap", width: 4000, height: 2000 },
      async (image, target, quality) => {
        calls.push({ image, target, quality });
        return encodedWebp;
      },
    );

    expect(blob).toBe(encodedWebp);
    expect(calls).toEqual([
      { image: "bitmap", target: { width: 1920, height: 960 }, quality: THEME_IMAGE_WEBP_QUALITY },
    ]);
  });

  it("keeps the source dimensions when they already fit", async () => {
    await processThemeImage({ image: "bitmap", width: 1200, height: 1600 }, async (_i, target) => {
      expect(target).toEqual({ width: 1200, height: 1600 });
      return encodedWebp;
    });
  });

  it("refuses a browser that silently falls back to another format", async () => {
    await expect(
      processThemeImage(
        { image: null, width: 1200, height: 1200 },
        async () => new Blob(["png-bytes"], { type: "image/png" }),
      ),
    ).rejects.toThrow(/webp/);
  });

  it("propagates an encoder failure", async () => {
    await expect(
      processThemeImage({ image: null, width: 1200, height: 1200 }, async () => {
        throw new Error("encoder exploded");
      }),
    ).rejects.toThrow("encoder exploded");
  });
});
