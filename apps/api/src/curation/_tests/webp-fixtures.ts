const webp = (fourcc: string, chunkData: Buffer): Buffer => {
  const header = Buffer.alloc(20);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(12 + chunkData.length, 4);
  header.write("WEBP", 8, "ascii");
  header.write(fourcc, 12, "ascii");
  header.writeUInt32LE(chunkData.length, 16);
  return Buffer.concat([header, chunkData]);
};

export const lossy = (width: number, height: number): Buffer => {
  const chunkData = Buffer.alloc(10);
  chunkData.set([0x9d, 0x01, 0x2a], 3);
  chunkData.writeUInt16LE(width, 6);
  chunkData.writeUInt16LE(height, 8);
  return webp("VP8 ", chunkData);
};

export const lossless = (width: number, height: number): Buffer => {
  const chunkData = Buffer.alloc(5);
  chunkData[0] = 0x2f;
  chunkData.writeUInt32LE(((height - 1) << 14) | (width - 1), 1);
  return webp("VP8L", chunkData);
};

export const extended = (width: number, height: number, flags = 0): Buffer => {
  const chunkData = Buffer.alloc(10);
  chunkData[0] = flags;
  chunkData.writeUIntLE(width - 1, 4, 3);
  chunkData.writeUIntLE(height - 1, 7, 3);
  return webp("VP8X", chunkData);
};

export const png = Buffer.concat([Buffer.from("\x89PNG\r\n\x1a\n", "latin1"), Buffer.alloc(32)]);
