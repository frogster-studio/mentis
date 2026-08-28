export const THEME_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
export const MIN_THEME_IMAGE_DIMENSION = 1000;
export const MAX_THEME_IMAGE_LONGEST_SIDE = 1920;
export const THEME_IMAGE_WEBP_QUALITY = 0.8;

export type ImageDimensions = { width: number; height: number };

export function themeImageFormatError(fileName: string): string | null {
  const dot = fileName.lastIndexOf(".");
  const extension = dot === -1 ? "" : fileName.slice(dot).toLowerCase();
  if (THEME_IMAGE_EXTENSIONS.includes(extension)) {
    return null;
  }
  const allowed = `${THEME_IMAGE_EXTENSIONS.slice(0, -1).join(", ")} or ${THEME_IMAGE_EXTENSIONS.at(-1)}`;
  return `This file is not a supported image format. Use ${allowed}.`;
}

export function themeImageDimensionsError({ width, height }: ImageDimensions): string | null {
  if (width >= MIN_THEME_IMAGE_DIMENSION && height >= MIN_THEME_IMAGE_DIMENSION) {
    return null;
  }
  return `This image is ${width}×${height}px. Theme images must be at least ${MIN_THEME_IMAGE_DIMENSION}×${MIN_THEME_IMAGE_DIMENSION}px.`;
}

export function fitWithinCap({ width, height }: ImageDimensions): ImageDimensions {
  const longest = Math.max(width, height);
  if (longest <= MAX_THEME_IMAGE_LONGEST_SIDE) {
    return { width, height };
  }
  const scale = MAX_THEME_IMAGE_LONGEST_SIDE / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export type ThemeImageEncoder<TImage> = (
  image: TImage,
  target: ImageDimensions,
  quality: number,
) => Promise<Blob>;

export async function processThemeImage<TImage>(
  source: { image: TImage } & ImageDimensions,
  encode: ThemeImageEncoder<TImage>,
): Promise<Blob> {
  const encoded = await encode(source.image, fitWithinCap(source), THEME_IMAGE_WEBP_QUALITY);
  // A browser without a webp encoder falls back to png silently; storing a mislabelled object is worse.
  if (encoded.type !== "image/webp") {
    throw new Error("This browser cannot encode webp images.");
  }
  return encoded;
}
