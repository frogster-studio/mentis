import { describe, expect, it } from "vitest";

import {
  fitWithinCap,
  imageDimensionsError,
  imageFormatError,
  processImage,
  WEBP_QUALITY,
} from "@/lib/images/pipeline";

describe("imageFormatError", () => {
  it("accepts .png, .jpg, .jpeg, and .webp files", () => {
    for (const name of ["a.png", "b.jpg", "c.jpeg", "d.webp"]) {
      expect(imageFormatError(name)).toBeNull();
    }
  });

  it("accepts uppercase extensions", () => {
    expect(imageFormatError("PHOTO.PNG")).toBeNull();
  });

  it("rejects other formats with the allowed list in the message", () => {
    for (const name of ["a.gif", "b.tiff", "c.heic", "d.pdf"]) {
      expect(imageFormatError(name)).toContain(".png, .jpg, .jpeg or .webp");
    }
  });

  it("rejects a file without an extension", () => {
    expect(imageFormatError("photo")).not.toBeNull();
  });
});

describe("imageDimensionsError", () => {
  it("accepts exactly 1000×1000", () => {
    expect(imageDimensionsError({ width: 1000, height: 1000 })).toBeNull();
  });

  it("rejects a width under the minimum, naming both sizes", () => {
    const error = imageDimensionsError({ width: 999, height: 2000 });
    expect(error).toContain("999×2000px");
    expect(error).toContain("1000×1000px");
  });

  it("rejects a height under the minimum", () => {
    expect(imageDimensionsError({ width: 2000, height: 800 })).not.toBeNull();
  });
});

describe("fitWithinCap", () => {
  it("caps the longest side at 1920 and keeps the aspect ratio", () => {
    expect(fitWithinCap({ width: 4000, height: 3000 })).toEqual({
      width: 1920,
      height: 1440,
    });
    expect(fitWithinCap({ width: 3000, height: 4000 })).toEqual({
      width: 1440,
      height: 1920,
    });
  });

  it("never upscales an image under the cap", () => {
    expect(fitWithinCap({ width: 1500, height: 1200 })).toEqual({
      width: 1500,
      height: 1200,
    });
    expect(fitWithinCap({ width: 1000, height: 1000 })).toEqual({
      width: 1000,
      height: 1000,
    });
  });

  it("keeps an image exactly at the cap", () => {
    expect(fitWithinCap({ width: 1920, height: 1080 })).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it("rounds the scaled shorter side", () => {
    expect(fitWithinCap({ width: 3001, height: 1999 })).toEqual({
      width: 1920,
      height: 1279,
    });
  });
});

describe("processImage", () => {
  const encodedWebp = new Blob(["webp-bytes"], { type: "image/webp" });

  it("hands the encoder the capped dimensions and the webp quality", async () => {
    const calls: unknown[] = [];
    const blob = await processImage(
      { image: "bitmap", width: 4000, height: 2000 },
      async (image, target, quality) => {
        calls.push({ image, target, quality });
        return encodedWebp;
      },
    );
    expect(blob).toBe(encodedWebp);
    expect(calls).toEqual([
      {
        image: "bitmap",
        target: { width: 1920, height: 960 },
        quality: WEBP_QUALITY,
      },
    ]);
  });

  it("keeps the source dimensions when already under the cap", async () => {
    await processImage(
      { image: "bitmap", width: 1200, height: 1600 },
      async (_image, target) => {
        expect(target).toEqual({ width: 1200, height: 1600 });
        return encodedWebp;
      },
    );
  });

  it("rejects when the encoder falls back to another format", async () => {
    await expect(
      processImage({ image: null, width: 1200, height: 1200 }, async () => {
        return new Blob(["png-bytes"], { type: "image/png" });
      }),
    ).rejects.toThrow(/webp/);
  });

  it("propagates an encoder failure", async () => {
    await expect(
      processImage({ image: null, width: 1200, height: 1200 }, async () => {
        throw new Error("encoder exploded");
      }),
    ).rejects.toThrow("encoder exploded");
  });
});
