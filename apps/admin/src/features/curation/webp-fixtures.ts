const webp = (fourcc: string, chunkData: Uint8Array): Uint8Array<ArrayBuffer> => {
  const bytes = new Uint8Array(20 + chunkData.length);
  const view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode("RIFF"), 0);
  view.setUint32(4, 12 + chunkData.length, true);
  bytes.set(new TextEncoder().encode(`WEBP${fourcc}`), 8);
  view.setUint32(16, chunkData.length, true);
  bytes.set(chunkData, 20);
  return bytes;
};

export const lossy = (width: number, height: number) => {
  const chunkData = new Uint8Array(10);
  const view = new DataView(chunkData.buffer);
  chunkData.set([0x9d, 0x01, 0x2a], 3);
  view.setUint16(6, width, true);
  view.setUint16(8, height, true);
  return webp("VP8 ", chunkData);
};

export const lossless = (width: number, height: number) => {
  const chunkData = new Uint8Array(5);
  chunkData[0] = 0x2f;
  new DataView(chunkData.buffer).setUint32(1, ((height - 1) << 14) | (width - 1), true);
  return webp("VP8L", chunkData);
};

export const extended = (width: number, height: number, flags = 0) => {
  const chunkData = new Uint8Array(10);
  chunkData[0] = flags;
  chunkData.set([width - 1, (width - 1) >> 8, (width - 1) >> 16], 4);
  chunkData.set([height - 1, (height - 1) >> 8, (height - 1) >> 16], 7);
  return webp("VP8X", chunkData);
};

export const webpFile = (bytes: Uint8Array<ArrayBuffer>, size = bytes.length) => {
  const padded = new Uint8Array(size);
  padded.set(bytes);
  return new File([padded], "photo.webp", { type: "image/webp" });
};
