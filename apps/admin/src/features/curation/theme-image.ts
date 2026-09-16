export const THEME_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
export const MIN_THEME_IMAGE_DIMENSION = 700;
export const MAX_THEME_IMAGE_BYTES = 2 * 1024 * 1024;
export const THEME_IMAGE_SIZE_ERROR =
  "Photo trop lourde, veuillez la compresser avant de l’importer.";

export type ImageDimensions = { width: number; height: number };

export function themeImageFormatError(fileName: string): string | null {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return THEME_IMAGE_EXTENSIONS.includes(extension)
    ? null
    : "Format non pris en charge. Choisissez une image JPG, JPEG, PNG ou WebP.";
}

export function themeImageDimensionsError({ width, height }: ImageDimensions): string | null {
  return width >= MIN_THEME_IMAGE_DIMENSION && height >= MIN_THEME_IMAGE_DIMENSION
    ? null
    : `Image trop petite (${width} × ${height} px). Minimum : 700 × 700 px.`;
}

export async function validateThemeImage(file: File): Promise<void> {
  const image = await decodeThemeImage(file);
  image.close();
}

async function decodeThemeImage(file: File): Promise<ImageBitmap> {
  const formatError = themeImageFormatError(file.name);
  if (formatError) throw new Error(formatError);
  if (file.size > MAX_THEME_IMAGE_BYTES) throw new Error(THEME_IMAGE_SIZE_ERROR);
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const actualType =
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      ? "image/jpeg"
      : bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10"
        ? "image/png"
        : String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
            String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
          ? "image/webp"
          : null;
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  const expectedType =
    extension === "jpg" || extension === "jpeg" ? "image/jpeg" : `image/${extension}`;
  if (actualType !== expectedType || (file.type && file.type !== actualType)) {
    throw new Error(
      "Le contenu du fichier ne correspond pas à une image JPG, JPEG, PNG ou WebP valide.",
    );
  }
  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file);
  } catch {
    throw new Error("Impossible de lire cette image. Choisissez un autre fichier.");
  }
  const dimensionError = themeImageDimensionsError(image);
  if (dimensionError) {
    image.close();
    throw new Error(dimensionError);
  }
  return image;
}

export async function processThemeImage(
  file: File,
  encode: (image: ImageBitmap) => Promise<Blob>,
): Promise<Blob> {
  const image = await decodeThemeImage(file);
  let encoded: Blob;
  try {
    if (file.name.toLowerCase().endsWith(".webp")) return file;
    encoded = await encode(image);
  } catch {
    throw new Error("La conversion en WebP a échoué. Réessayez avec une autre image.");
  } finally {
    image.close();
  }
  if (encoded.type !== "image/webp" || encoded.size === 0) {
    throw new Error("La conversion en WebP a échoué. Réessayez avec une autre image.");
  }
  if (encoded.size > MAX_THEME_IMAGE_BYTES) {
    throw new Error("L’image convertie dépasse 2 Mo. Veuillez la compresser avant de l’importer.");
  }
  return encoded;
}
