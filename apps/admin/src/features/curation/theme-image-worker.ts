import encode, { init } from "@jsquash/webp/encode.js";
import { MAX_THEME_IMAGE_BYTES } from "./theme-image";

self.onmessage = async (event: MessageEvent<ImageBitmap>) => {
  const image = event.data;
  try {
    const canvas = new OffscreenCanvas(image.width, image.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas indisponible.");
    context.drawImage(image, 0, 0);
    await init({ locateFile: (file: string) => `/theme-image-codec/${file}` });
    const data = context.getImageData(0, 0, image.width, image.height);
    const lossless = { lossless: 1, near_lossless: 100, exact: 1 };
    // In lossless mode, quality controls encoding effort without changing the pixels.
    let bytes = await encode(data, { ...lossless, method: 4, quality: 0 });
    if (bytes.byteLength > MAX_THEME_IMAGE_BYTES)
      bytes = await encode(data, { ...lossless, method: 4, quality: 75 });
    self.postMessage({ blob: new Blob([bytes], { type: "image/webp" }) });
  } catch {
    self.postMessage({ error: "La conversion en WebP a échoué." });
  } finally {
    image.close();
  }
};
