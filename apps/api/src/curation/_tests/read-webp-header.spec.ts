import { describe, expect, it } from "vitest";
import { readWebpHeader } from "../utils/read-webp-header";

const webp = (fourcc: string, chunkData: Buffer): Buffer => {
  const header = Buffer.alloc(20);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(12 + chunkData.length, 4);
  header.write("WEBP", 8, "ascii");
  header.write(fourcc, 12, "ascii");
  header.writeUInt32LE(chunkData.length, 16);
  return Buffer.concat([header, chunkData]);
};

const lossy = (width: number, height: number): Buffer => {
  const chunkData = Buffer.alloc(10);
  chunkData.set([0x9d, 0x01, 0x2a], 3);
  chunkData.writeUInt16LE(width, 6);
  chunkData.writeUInt16LE(height, 8);
  return webp("VP8 ", chunkData);
};

const lossless = (width: number, height: number): Buffer => {
  const chunkData = Buffer.alloc(5);
  chunkData[0] = 0x2f;
  chunkData.writeUInt32LE(((height - 1) << 14) | (width - 1), 1);
  return webp("VP8L", chunkData);
};

const extended = (width: number, height: number, flags = 0): Buffer => {
  const chunkData = Buffer.alloc(10);
  chunkData[0] = flags;
  chunkData.writeUIntLE(width - 1, 4, 3);
  chunkData.writeUIntLE(height - 1, 7, 3);
  return webp("VP8X", chunkData);
};

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
    [
      "a non-RIFF file",
      Buffer.concat([Buffer.from("\x89PNG\r\n\x1a\n", "latin1"), Buffer.alloc(32)]),
    ],
    ["a RIFF that is not WEBP", Buffer.from(lossy(750, 1024)).fill("WAVE", 8, 12)],
    ["a truncated header", lossy(750, 1024).subarray(0, 25)],
    ["an empty file", Buffer.alloc(0)],
    ["a VP8 without its start code", Buffer.from(lossy(750, 1024)).fill(0, 23, 26)],
    ["a VP8L without its signature", Buffer.from(lossless(750, 1024)).fill(0, 20, 21)],
  ])("answers null for %s", (_, file) => {
    expect(readWebpHeader(file)).toBeNull();
  });
});
