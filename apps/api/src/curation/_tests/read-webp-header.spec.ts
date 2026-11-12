import { describe, expect, it } from "vitest";
import { readWebpHeader } from "../utils/read-webp-header";
import { extended, lossless, lossy, png } from "./webp-fixtures";

describe("readWebpHeader", () => {
  it.each([
    ["a lossy VP8", lossy(750, 1024)],
    ["a lossless VP8L", lossless(750, 1024)],
    ["an extended VP8X", extended(750, 1024)],
  ])("reads the width and height of %s", (_, file) => {
    expect(readWebpHeader(file)).toEqual({ width: 750, height: 1024, animated: false });
  });

  it("tells an animated WebP by its VP8X animation flag", () => {
    expect(readWebpHeader(extended(750, 1024, 0x02))).toEqual({
      width: 750,
      height: 1024,
      animated: true,
    });
  });

  it("keeps a static VP8X with other flags set static", () => {
    expect(readWebpHeader(extended(750, 1024, 0x10))?.animated).toBe(false);
  });

  it.each([
    ["a non-RIFF file", png],
    ["a RIFF that is not WEBP", Buffer.from(lossy(750, 1024)).fill("WAVE", 8, 12)],
    ["a truncated header", lossy(750, 1024).subarray(0, 25)],
    ["an empty file", Buffer.alloc(0)],
    ["a VP8 without its start code", Buffer.from(lossy(750, 1024)).fill(0, 23, 26)],
    ["a VP8L without its signature", Buffer.from(lossless(750, 1024)).fill(0, 20, 21)],
  ])("answers null for %s", (_, file) => {
    expect(readWebpHeader(file)).toBeNull();
  });
});
