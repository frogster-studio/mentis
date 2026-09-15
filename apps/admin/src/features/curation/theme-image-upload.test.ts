import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFromApi, sendToApi } from "@/lib/api/client";
import { saveThemeWithImage } from "./theme-image-upload";

vi.mock("@/lib/api/client", () => ({ getFromApi: vi.fn(), sendToApi: vi.fn() }));
vi.mock("./theme-image", () => ({ processThemeImage: vi.fn(async (file: File) => file) }));
const theme = {
  name: "Les Simpson",
  categoryId: "category",
  image: "old.webp",
  expectedImage: "old.webp",
};
const upload = {
  path: "theme/version/les-simpson.webp",
  signedUrl: "https://storage.example/signed",
  token: "authorization",
};
const stored = { ...theme, id: "theme", image: upload.path, published: false };

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
});
afterEach(() => vi.unstubAllGlobals());

describe("interrupted replacement", () => {
  it("recovers a committed save whose response was lost, then cleans up", async () => {
    vi.mocked(sendToApi)
      .mockResolvedValueOnce(upload)
      .mockRejectedValueOnce(new TypeError("network interrupted"))
      .mockResolvedValueOnce({ deleted: true });
    vi.mocked(getFromApi).mockResolvedValue([stored]);
    expect(
      await saveThemeWithImage({ id: "theme", theme, file: new File(["webp"], "new.webp") }),
    ).toEqual(stored);
    expect(sendToApi).toHaveBeenLastCalledWith(
      "POST",
      "/themes/image-cleanup",
      { token: upload.token },
      expect.anything(),
    );
  });
  it("does not try to clean up the default after recovering a replacement", async () => {
    vi.mocked(sendToApi)
      .mockResolvedValueOnce(upload)
      .mockRejectedValueOnce(new TypeError("network interrupted"));
    vi.mocked(getFromApi).mockResolvedValue([stored]);
    expect(
      await saveThemeWithImage({
        id: "theme",
        theme: { ...theme, image: "default.webp", expectedImage: "default.webp" },
        file: new File(["webp"], "new.webp"),
      }),
    ).toEqual(stored);
    expect(sendToApi).toHaveBeenCalledTimes(2);
  });
  it("returns a retry token if cleanup fails after recovering the saved reference", async () => {
    vi.mocked(sendToApi)
      .mockResolvedValueOnce(upload)
      .mockRejectedValueOnce(new TypeError("network interrupted"))
      .mockRejectedValueOnce(new Error("Storage offline"));
    vi.mocked(getFromApi).mockResolvedValue([stored]);
    expect(
      await saveThemeWithImage({ id: "theme", theme, file: new File(["webp"], "new.webp") }),
    ).toEqual({ ...stored, cleanupToken: upload.token });
  });
  it("does not delete anything when the commit outcome cannot be established", async () => {
    vi.mocked(sendToApi)
      .mockResolvedValueOnce(upload)
      .mockRejectedValueOnce(new TypeError("network interrupted"));
    vi.mocked(getFromApi).mockRejectedValueOnce(new TypeError("still offline"));
    await expect(
      saveThemeWithImage({ id: "theme", theme, file: new File(["webp"], "new.webp") }),
    ).rejects.toThrow("network interrupted");
    expect(sendToApi).toHaveBeenCalledTimes(2);
  });
  it("does not write the database if the upload loses its connection", async () => {
    vi.mocked(sendToApi).mockResolvedValueOnce(upload);
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("offline"));
    await expect(
      saveThemeWithImage({ id: "theme", theme, file: new File(["webp"], "new.webp") }),
    ).rejects.toThrow("Connexion interrompue");
    expect(sendToApi).toHaveBeenCalledTimes(1);
  });
});
