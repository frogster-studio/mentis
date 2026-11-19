import { describe, expect, it } from "vitest";
import { imageRuleError, selectedImageError } from "./image-rule";
import { extended, lossless, lossy, webpFile } from "./webp-fixtures";

const FORMAT = "L’image doit être un fichier WebP.";
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, ...new Uint8Array(32)]);
const jpg = new Uint8Array([255, 216, 255, ...new Uint8Array(37)]);
const candidate = (header = lossy(750, 1024), name = "photo.webp", type = "image/webp") => ({
  name,
  type,
  size: header.length,
  header,
});

describe("the admin image rule", () => {
  it.each([
    ["lossy", lossy(750, 1024)],
    ["lossless", lossless(750, 1024)],
    ["extended", extended(750, 1024)],
  ])("accepts a static 750 × 1024 %s WebP", (_, header) =>
    expect(imageRuleError(candidate(header))).toBeNull(),
  );

  it("accepts an upper-case extension and a browser that sends no MIME type", () => {
    expect(imageRuleError(candidate(lossy(750, 1024), "PHOTO.WEBP"))).toBeNull();
    expect(imageRuleError(candidate(lossy(750, 1024), "photo.webp", ""))).toBeNull();
  });

  it.each([
    ["a JPG", candidate(jpg, "photo.jpg", "image/jpeg")],
    ["a PNG", candidate(png, "photo.png", "image/png")],
    ["a PNG named .webp", candidate(png, "photo.webp", "image/webp")],
    ["a WebP named .png", candidate(lossy(750, 1024), "photo.png", "image/png")],
    ["a WebP typed image/png", candidate(lossy(750, 1024), "photo.webp", "image/png")],
    ["a WebP without extension", candidate(lossy(750, 1024), "photo", "image/webp")],
  ])("refuses %s as not WebP", (_, image) => expect(imageRuleError(image)).toBe(FORMAT));

  it("refuses an animated WebP", () =>
    expect(imageRuleError(candidate(extended(750, 1024, 0x02)))).toBe(
      "L’image ne doit pas être animée.",
    ));

  it.each([
    [749, 1024],
    [750, 1025],
    [1024, 750],
    [1500, 2048],
  ])("refuses a static %i × %i WebP", (width, height) =>
    expect(imageRuleError(candidate(lossless(width, height)))).toBe(
      "L’image doit mesurer 750 × 1024 px.",
    ),
  );

  it("accepts 204 800 bytes and refuses 204 801", () => {
    expect(imageRuleError({ ...candidate(), size: 204_800 })).toBeNull();
    expect(imageRuleError({ ...candidate(), size: 204_801 })).toBe("L’image dépasse 200 Ko.");
  });

  it.each([
    ["a truncated header", lossy(750, 1024).slice(0, 16)],
    ["a VP8 chunk without start code", lossy(750, 1024).fill(0, 23, 26)],
    ["an unknown chunk", Object.assign(lossy(750, 1024), { 12: 0x41 })],
  ])("reports %s as unreadable", (_, header) =>
    expect(imageRuleError(candidate(header))).toBe(
      "Impossible de lire cette image. Choisissez un autre fichier.",
    ),
  );
});

describe("a selection of files", () => {
  it("accepts one valid file at exactly 204 800 bytes", async () =>
    expect(await selectedImageError([webpFile(lossy(750, 1024), 204_800)])).toBeNull());

  it("reads the size of the whole file, not of its header", async () =>
    expect(await selectedImageError([webpFile(lossy(750, 1024), 204_801)])).toBe(
      "L’image dépasse 200 Ko.",
    ));

  it("refuses several files", async () => {
    const file = webpFile(lossy(750, 1024));
    expect(await selectedImageError([file, file])).toBe("Choisissez une seule image à la fois.");
  });

  it("applies the rule to the file's own bytes", async () =>
    expect(await selectedImageError([new File([png], "photo.webp", { type: "image/webp" })])).toBe(
      FORMAT,
    ));
});
