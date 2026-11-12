import type { WebpHeader } from "../types/webp-header";

const CHUNK_DATA_OFFSET = 20;
const VP8L_SIGNATURE = 0x2f;
const VP8X_ANIMATION_FLAG = 0x02;
const FOURTEEN_BITS = 0x3fff;

const readLossy = (chunk: Buffer): WebpHeader | null => {
  const hasStartCode = chunk[3] === 0x9d && chunk[4] === 0x01 && chunk[5] === 0x2a;
  if (chunk.length < 10 || !hasStartCode) return null;
  return {
    width: chunk.readUInt16LE(6) & FOURTEEN_BITS,
    height: chunk.readUInt16LE(8) & FOURTEEN_BITS,
    animated: false,
  };
};

const readLossless = (chunk: Buffer): WebpHeader | null => {
  if (chunk.length < 5 || chunk[0] !== VP8L_SIGNATURE) return null;
  const bits = chunk.readUInt32LE(1);
  return {
    width: (bits & FOURTEEN_BITS) + 1,
    height: ((bits >>> 14) & FOURTEEN_BITS) + 1,
    animated: false,
  };
};

const readExtended = (chunk: Buffer): WebpHeader | null => {
  if (chunk.length < 10) return null;
  return {
    width: chunk.readUIntLE(4, 3) + 1,
    height: chunk.readUIntLE(7, 3) + 1,
    animated: (chunk[0] & VP8X_ANIMATION_FLAG) !== 0,
  };
};

// Reads the file's own bytes, never its Content-Type, so a mislabelled upload cannot pass.
export const readWebpHeader = (file: Buffer): WebpHeader | null => {
  if (file.length < CHUNK_DATA_OFFSET) return null;
  if (file.toString("ascii", 0, 4) !== "RIFF" || file.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }
  const chunk = file.subarray(CHUNK_DATA_OFFSET);
  switch (file.toString("ascii", 12, 16)) {
    case "VP8 ":
      return readLossy(chunk);
    case "VP8L":
      return readLossless(chunk);
    case "VP8X":
      return readExtended(chunk);
    default:
      return null;
  }
};
