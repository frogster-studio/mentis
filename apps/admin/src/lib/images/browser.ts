// Everything here needs browser APIs — the testable logic lives in pipeline.ts.

import { createCardImageUpload } from "@/lib/images/actions";
import { type ImageDimensions, processImage } from "@/lib/images/pipeline";

// Callers must close() the bitmap once done with it.
export async function decodeImage(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

async function encodeWebp(
  image: ImageBitmap,
  target: ImageDimensions,
  quality: number,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(target.width, target.height);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is unavailable in this browser.");
  }
  context.drawImage(image, 0, 0, target.width, target.height);
  return canvas.convertToBlob({ type: "image/webp", quality });
}

// The original file never leaves the browser — only the processed webp is uploaded.
export async function uploadCardImage(file: File): Promise<string> {
  const image = await decodeImage(file);
  let blob: Blob;
  try {
    blob = await processImage({ image, width: image.width, height: image.height }, encodeWebp);
  } finally {
    image.close();
  }

  const upload = await createCardImageUpload();
  const response = await fetch(upload.signedUrl, {
    method: "PUT",
    headers: { "content-type": "image/webp" },
    body: blob,
  });
  if (!response.ok) {
    throw new Error(`Image upload failed (${response.status}).`);
  }
  return upload.path;
}
