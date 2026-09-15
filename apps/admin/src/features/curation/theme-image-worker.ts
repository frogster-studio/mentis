import encode, { init } from "@jsquash/webp/encode.js";

self.onmessage = async (event: MessageEvent<File>) => {
  let image: ImageBitmap | undefined;
  try {
    image = await createImageBitmap(event.data);
    const canvas = new OffscreenCanvas(image.width, image.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas indisponible.");
    context.drawImage(image, 0, 0);
    await init({ locateFile: (file: string) => `/theme-image-codec/${file}` });
    const data = context.getImageData(0, 0, image.width, image.height);
    const bytes = await encode(data, { lossless: 1, near_lossless: 100, exact: 1 });
    self.postMessage({ blob: new Blob([bytes], { type: "image/webp" }) });
  } catch {
    self.postMessage({ error: "La conversion en WebP a échoué." });
  } finally {
    image?.close();
  }
};
