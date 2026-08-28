import { adminThemeImageUploadResponseSchema } from "@mentis/contracts/admin";

import { sendToApi } from "@/lib/api/client";
import {
  type ImageDimensions,
  processThemeImage,
  themeImageDimensionsError,
  themeImageFormatError,
} from "./theme-image";

async function encodeWebp(
  image: ImageBitmap,
  target: ImageDimensions,
  quality: number,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(target.width, target.height);
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D is unavailable in this browser.");
  }
  context.drawImage(image, 0, 0, target.width, target.height);
  return canvas.convertToBlob({ type: "image/webp", quality });
}

async function decodeThemeImage(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error("This file could not be read as an image.");
  }
}

async function processPickedFile(file: File): Promise<Blob> {
  const image = await decodeThemeImage(file);
  try {
    const tooSmall = themeImageDimensionsError(image);
    if (tooSmall !== null) {
      throw new Error(tooSmall);
    }
    return await processThemeImage({ image, width: image.width, height: image.height }, encodeWebp);
  } finally {
    image.close();
  }
}

// ADR 0007: the processed file goes straight to storage, never through the API or the BFF.
export async function uploadThemeImage(file: File): Promise<string> {
  const wrongFormat = themeImageFormatError(file.name);
  if (wrongFormat !== null) {
    throw new Error(wrongFormat);
  }
  const encoded = await processPickedFile(file);

  const upload = await sendToApi(
    "POST",
    "/themes/image-upload-url",
    undefined,
    adminThemeImageUploadResponseSchema,
  );
  const stored = await fetch(upload.signedUrl, {
    method: "PUT",
    headers: { "content-type": "image/webp" },
    body: encoded,
  });
  if (!stored.ok) {
    throw new Error(`The image upload failed (${stored.status}).`);
  }
  return upload.path;
}
