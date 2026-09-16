import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_THEME_IMAGE_BYTES,
  processThemeImage,
  themeImageDimensionsError,
  themeImageFormatError,
  validateThemeImage,
} from "./theme-image";

const png = [137, 80, 78, 71, 13, 10, 26, 10];
const webp = [..."RIFF0000WEBP"].map((char) => char.charCodeAt(0));
const file = (name = "photo.png", bytes = png, type = "image/png") =>
  new File([new Uint8Array(bytes)], name, { type });
let close: ReturnType<typeof vi.fn>;
beforeEach(() => {
  close = vi.fn();
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 700, height: 900, close }));
});
afterEach(() => vi.unstubAllGlobals());

describe("image validation", () => {
  it.each(["a.png", "b.jpg", "c.jpeg", "d.webp", "PHOTO.PNG"])("accepts %s", (name) =>
    expect(themeImageFormatError(name)).toBeNull(),
  );
  it.each(["a.gif", "b.tiff", "c.heic", "d.pdf", "no-extension"])("rejects %s", (name) =>
    expect(themeImageFormatError(name)).toContain("JPG, JPEG, PNG ou WebP"),
  );
  it.each([
    [700, 700],
    [700, 1900],
    [1000, 700],
  ])("accepts %i × %i", (width, height) =>
    expect(themeImageDimensionsError({ width, height })).toBeNull(),
  );
  it.each([
    [699, 1000],
    [1000, 699],
  ])("rejects %i × %i", (width, height) =>
    expect(themeImageDimensionsError({ width, height })).toContain("700 × 700"),
  );
  it.each([
    ["photo.jpg", [255, 216, 255], "image/jpeg"],
    ["photo.jpeg", [255, 216, 255], "image/jpeg"],
    ["photo.png", png, "image/png"],
    ["photo.webp", webp, "image/webp"],
  ])("validates the content of %s", async (name, bytes, type) => {
    await expect(validateThemeImage(file(name, bytes, type))).resolves.toBeUndefined();
    expect(close).toHaveBeenCalledOnce();
  });
  it("accepts exactly 2 MiB", async () => {
    const bytes = new Uint8Array(MAX_THEME_IMAGE_BYTES);
    bytes.set(png);
    await expect(validateThemeImage(new File([bytes], "photo.png"))).resolves.toBeUndefined();
  });
  it("rejects oversized images before decoding", async () => {
    await expect(
      validateThemeImage(new File([new Uint8Array(MAX_THEME_IMAGE_BYTES + 1)], "a.png")),
    ).rejects.toThrow("Photo trop lourde");
    expect(createImageBitmap).not.toHaveBeenCalled();
  });
  it("rejects an extension or MIME that hides another format", async () => {
    await expect(validateThemeImage(file("fake.webp"))).rejects.toThrow("contenu");
    await expect(validateThemeImage(file("fake.png", png, "image/gif"))).rejects.toThrow("contenu");
  });
  it("reports unreadable images", async () => {
    vi.mocked(createImageBitmap).mockRejectedValue(new Error("decode failed"));
    await expect(validateThemeImage(file())).rejects.toThrow("Impossible de lire");
  });
  it("closes a decoded image even when it is too small", async () => {
    vi.mocked(createImageBitmap).mockResolvedValue({
      width: 699,
      height: 800,
      close,
    } as unknown as ImageBitmap);
    await expect(validateThemeImage(file())).rejects.toThrow("trop petite");
    expect(close).toHaveBeenCalledOnce();
  });
});

describe("WebP conversion", () => {
  it("preserves an existing WebP without encoding", async () => {
    const original = file("photo.webp", webp, "image/webp");
    const encode = vi.fn();
    expect(await processThemeImage(original, encode)).toBe(original);
    expect(encode).not.toHaveBeenCalled();
  });
  it("decodes once and passes the original dimensions to the encoder without resizing", async () => {
    const original = file();
    const converted = new Blob(["webp"], { type: "image/webp" });
    const encode = vi.fn().mockResolvedValue(converted);
    expect(await processThemeImage(original, encode)).toBe(converted);
    expect(createImageBitmap).toHaveBeenCalledOnce();
    expect(createImageBitmap).toHaveBeenCalledWith(original);
    expect(encode).toHaveBeenCalledWith({ width: 700, height: 900, close });
    expect(close).toHaveBeenCalledOnce();
  });
  it("revalidates immediately before encoding", async () => {
    const encode = vi.fn();
    await expect(processThemeImage(file("bad.gif"), encode)).rejects.toThrow("Format");
    expect(encode).not.toHaveBeenCalled();
  });
  it("reports encoder failure", async () => {
    await expect(processThemeImage(file(), vi.fn().mockRejectedValue(new Error()))).rejects.toThrow(
      "conversion",
    );
    expect(close).toHaveBeenCalledOnce();
  });
  it("refuses a non-WebP or empty encoder result", async () => {
    for (const result of [
      new Blob(["png"], { type: "image/png" }),
      new Blob([], { type: "image/webp" }),
    ]) {
      await expect(processThemeImage(file(), async () => result)).rejects.toThrow("conversion");
    }
  });
  it("rejects oversized conversion output without trying to compress it", async () => {
    const encode = vi
      .fn()
      .mockResolvedValue(
        new Blob([new Uint8Array(MAX_THEME_IMAGE_BYTES + 1)], { type: "image/webp" }),
      );
    await expect(processThemeImage(file(), encode)).rejects.toThrow("convertie dépasse");
    expect(encode).toHaveBeenCalledOnce();
  });
});
