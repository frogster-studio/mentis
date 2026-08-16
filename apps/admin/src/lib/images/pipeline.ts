// The encoder is injected so the whole pipeline runs under vitest without a browser (ADR 0001).

export const IMAGE_FILE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
export const MIN_IMAGE_DIMENSION = 1000;
export const MAX_IMAGE_LONGEST_SIDE = 1920;
export const WEBP_QUALITY = 0.8;

export type ImageDimensions = { width: number; height: number };

export function imageFormatError(fileName: string): string | null {
  const dot = fileName.lastIndexOf(".");
  const extension = dot === -1 ? "" : fileName.slice(dot).toLowerCase();
  if (IMAGE_FILE_EXTENSIONS.includes(extension)) return null;
  const allowed = `${IMAGE_FILE_EXTENSIONS.slice(0, -1).join(", ")} or ${IMAGE_FILE_EXTENSIONS.at(-1)}`;
  return `This file is not a supported image format. Use ${allowed}.`;
}

export function imageDimensionsError({ width, height }: ImageDimensions): string | null {
  if (width >= MIN_IMAGE_DIMENSION && height >= MIN_IMAGE_DIMENSION) {
    return null;
  }
  return `This image is ${width}×${height}px. Images must be at least ${MIN_IMAGE_DIMENSION}×${MIN_IMAGE_DIMENSION}px.`;
}

export function fitWithinCap({ width, height }: ImageDimensions): ImageDimensions {
  const longest = Math.max(width, height);
  if (longest <= MAX_IMAGE_LONGEST_SIDE) {
    return { width, height };
  }
  const scale = MAX_IMAGE_LONGEST_SIDE / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export type ImageEncoder<TImage> = (
  image: TImage,
  target: ImageDimensions,
  quality: number,
) => Promise<Blob>;

export async function processImage<TImage>(
  source: { image: TImage } & ImageDimensions,
  encode: ImageEncoder<TImage>,
): Promise<Blob> {
  const target = fitWithinCap(source);
  const blob = await encode(source.image, target, WEBP_QUALITY);
  // A browser without a webp encoder silently falls back to png.
  if (blob.type !== "image/webp") {
    throw new Error("This browser cannot encode webp images.");
  }
  return blob;
}

export type ImageOutcome<TValue> =
  | { status: "success"; value: TValue }
  | { status: "error"; message: string };

// One bad Image yields its own error outcome and never throws the batch.
export async function settleImages<TSource, TValue>(
  sources: TSource[],
  process: (source: TSource) => Promise<TValue>,
): Promise<ImageOutcome<TValue>[]> {
  return Promise.all(
    sources.map(async (source): Promise<ImageOutcome<TValue>> => {
      try {
        return { status: "success", value: await process(source) };
      } catch (error) {
        return {
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );
}
