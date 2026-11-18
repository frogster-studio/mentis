const IMAGE_WIDTH = 750;
const IMAGE_HEIGHT = 1024;
const MAX_IMAGE_BYTES = 204_800;
const WEBP_HEADER_BYTES = 30;
const CHUNK_DATA_OFFSET = 20;
const VP8L_SIGNATURE = 0x2f;
const VP8X_ANIMATION_FLAG = 0x02;
const FOURTEEN_BITS = 0x3fff;

const FORMAT_ERROR = "L’image doit être un fichier WebP.";
const ANIMATED_ERROR = "L’image ne doit pas être animée.";
const DIMENSIONS_ERROR = `L’image doit mesurer ${IMAGE_WIDTH} × ${IMAGE_HEIGHT} px.`;
const SIZE_ERROR = "L’image dépasse 200 Ko.";
const UNREADABLE_ERROR = "Impossible de lire cette image. Choisissez un autre fichier.";
const SEVERAL_IMAGES_ERROR = "Choisissez une seule image à la fois.";

interface WebpHeader {
  width: number;
  height: number;
  animated: boolean;
}

interface ImageCandidate {
  name: string;
  type: string;
  size: number;
  header: Uint8Array;
}

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.subarray(start, end));

const uint24 = (view: DataView, offset: number) =>
  view.getUint8(offset) | (view.getUint8(offset + 1) << 8) | (view.getUint8(offset + 2) << 16);

const hasWebpSignature = (bytes: Uint8Array) =>
  bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";

const readWebpHeader = (bytes: Uint8Array): WebpHeader | null => {
  if (bytes.length < CHUNK_DATA_OFFSET) return null;
  const chunk = new DataView(bytes.buffer, bytes.byteOffset + CHUNK_DATA_OFFSET);
  switch (ascii(bytes, 12, 16)) {
    case "VP8 ": {
      const hasStartCode =
        chunk.byteLength >= 10 &&
        chunk.getUint8(3) === 0x9d &&
        chunk.getUint8(4) === 0x01 &&
        chunk.getUint8(5) === 0x2a;
      if (!hasStartCode) return null;
      return {
        width: chunk.getUint16(6, true) & FOURTEEN_BITS,
        height: chunk.getUint16(8, true) & FOURTEEN_BITS,
        animated: false,
      };
    }
    case "VP8L": {
      if (chunk.byteLength < 5 || chunk.getUint8(0) !== VP8L_SIGNATURE) return null;
      const bits = chunk.getUint32(1, true);
      return {
        width: (bits & FOURTEEN_BITS) + 1,
        height: ((bits >>> 14) & FOURTEEN_BITS) + 1,
        animated: false,
      };
    }
    case "VP8X":
      if (chunk.byteLength < 10) return null;
      return {
        width: uint24(chunk, 4) + 1,
        height: uint24(chunk, 7) + 1,
        animated: (chunk.getUint8(0) & VP8X_ANIMATION_FLAG) !== 0,
      };
    default:
      return null;
  }
};

export function imageRuleError({ name, type, size, header }: ImageCandidate): string | null {
  const isDeclaredWebp = name.toLowerCase().endsWith(".webp") && ["", "image/webp"].includes(type);
  if (!isDeclaredWebp || !hasWebpSignature(header)) return FORMAT_ERROR;
  const webp = readWebpHeader(header);
  if (webp === null) return UNREADABLE_ERROR;
  if (webp.animated) return ANIMATED_ERROR;
  if (webp.width !== IMAGE_WIDTH || webp.height !== IMAGE_HEIGHT) return DIMENSIONS_ERROR;
  if (size > MAX_IMAGE_BYTES) return SIZE_ERROR;
  return null;
}

export async function selectedImageError(files: readonly File[]): Promise<string | null> {
  if (files.length !== 1) return SEVERAL_IMAGES_ERROR;
  const [file] = files;
  let header: Uint8Array;
  try {
    header = new Uint8Array(await file.slice(0, WEBP_HEADER_BYTES).arrayBuffer());
  } catch {
    return UNREADABLE_ERROR;
  }
  return imageRuleError({ name: file.name, type: file.type, size: file.size, header });
}
