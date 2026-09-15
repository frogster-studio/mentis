import encode, { init } from "@jsquash/webp/encode.js";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("@jsquash/webp/encode.js", () => ({ default: vi.fn(), init: vi.fn() }));
const worker = {
  onmessage: undefined as ((event: MessageEvent<File>) => Promise<void>) | undefined,
  postMessage: vi.fn(),
};
const image = { width: 900, height: 700, close: vi.fn() };
const pixels = { width: 900, height: 700, data: new Uint8ClampedArray(900 * 700 * 4) };
const context = { drawImage: vi.fn(), getImageData: vi.fn(() => pixels) };

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubGlobal("self", worker);
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(image));
  vi.stubGlobal(
    "OffscreenCanvas",
    class {
      getContext() {
        return context;
      }
    },
  );
  vi.mocked(encode).mockResolvedValue(new ArrayBuffer(10));
  await import("./theme-image-worker");
});
afterEach(() => vi.unstubAllGlobals());

it("encodes losslessly with original dimensions and exact pixels", async () => {
  await worker.onmessage?.({ data: new File(["png"], "photo.png") } as MessageEvent<File>);
  expect(context.drawImage).toHaveBeenCalledWith(image, 0, 0);
  expect(context.getImageData).toHaveBeenCalledWith(0, 0, 900, 700);
  expect(init).toHaveBeenCalledOnce();
  expect(encode).toHaveBeenCalledWith(pixels, { lossless: 1, near_lossless: 100, exact: 1 });
  expect(worker.postMessage.mock.calls[0][0].blob.type).toBe("image/webp");
  expect(image.close).toHaveBeenCalledOnce();
});

it("reports conversion failures and releases the decoded bitmap", async () => {
  vi.mocked(encode).mockRejectedValueOnce(new Error("WASM error"));
  await worker.onmessage?.({ data: new File(["png"], "photo.png") } as MessageEvent<File>);
  expect(worker.postMessage).toHaveBeenCalledWith({ error: "La conversion en WebP a échoué." });
  expect(image.close).toHaveBeenCalledOnce();
});
