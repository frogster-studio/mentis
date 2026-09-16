import { type AdminThemeWrite, DEFAULT_THEME_IMAGE } from "@mentis/contracts/admin";
import { ConflictException } from "@nestjs/common";
import { createClient, StorageApiError, type SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeEntity } from "../../_database/entities/theme.entity";
import { testEnv } from "../../_tests/test-env";
import { CurationRepository } from "../repositories/curation.repository";
import { CurationService } from "../services/curation.service";
import { ThemeImageService } from "../services/theme-image.service";

const id = "5c2e0d3a-0000-4000-8000-000000000001";
const categoryId = "3f1d0d3a-0000-4000-8000-000000000001";
let current: ThemeEntity;
let events: string[];
const storage = {
  createSignedUploadUrl: vi.fn(),
  info: vi.fn<ReturnType<SupabaseClient["storage"]["from"]>["info"]>(),
  remove: vi.fn(),
};
const repository = {
  findTheme: vi.fn(),
  isImageReferenced: vi.fn(),
  updateTheme: vi.fn(),
  createTheme: vi.fn(),
};
let images: ThemeImageService;
let curation: CurationService;
const write = (image = current.image): AdminThemeWrite => ({
  name: current.name,
  categoryId,
  image,
  expectedImage: current.image,
});
const sign = () =>
  images.createUploadUrl({ themeId: id, name: "Nom modifié", expectedImage: current.image });

beforeEach(() => {
  vi.resetAllMocks();
  events = [];
  current = Object.assign(new ThemeEntity(), {
    id,
    categoryId,
    slug: "les-simpson",
    name: "Les Simpson",
    image: "old.webp",
    published: false,
    updatedAt: new Date("2026-09-01T00:00:00Z"),
  });
  repository.findTheme.mockImplementation(async () => ({ ...current }));
  repository.isImageReferenced.mockImplementation(async ({ image }) => image === current.image);
  repository.updateTheme.mockImplementation(async (patch, expected) => {
    events.push("database");
    if (expected.image !== current.image) throw new ConflictException();
    current = Object.assign(new ThemeEntity(), current, patch);
    return current;
  });
  repository.createTheme.mockImplementation(async (theme) =>
    Object.assign(new ThemeEntity(), theme, { id: theme.id ?? id }),
  );
  storage.createSignedUploadUrl.mockImplementation(async (path) => ({
    data: { signedUrl: `https://storage.example/${path}` },
    error: null,
  }));
  storage.info.mockImplementation(async () => {
    events.push("verify-upload");
    return {
      data: {
        id: "object-id",
        name: "image.webp",
        bucketId: "theme-images",
        version: "version-id",
        createdAt: "2026-09-16T00:00:00Z",
        contentType: "image/webp",
        size: 1024,
      },
      error: null,
    };
  });
  storage.remove.mockImplementation(async () => {
    events.push("delete");
    return { error: null };
  });
  images = new ThemeImageService(
    { storage: { from: () => storage } } as unknown as SupabaseClient,
    testEnv,
    repository as unknown as CurationRepository,
  );
  curation = new CurationService(repository as unknown as CurationRepository, images);
});

describe("image authorization", () => {
  it("uses the immutable slug and unique folders, even when the theme is renamed", async () => {
    const first = await sign();
    const second = await sign();
    expect(first.path).toMatch(new RegExp(`^${id}/[a-f0-9-]{36}/les-simpson.webp$`));
    expect(second.path).not.toBe(first.path);
    expect(storage.createSignedUploadUrl.mock.calls[0]).toEqual([first.path]);
  });
  it("derives the initial slug and separates new themes with colliding names", async () => {
    const input = { name: "Été & Soleil", expectedImage: DEFAULT_THEME_IMAGE };
    const first = await images.createUploadUrl(input);
    const second = await images.createUploadUrl(input);
    expect(first.path).toMatch(/\/ete-soleil.webp$/);
    expect(second.path.split("/")[0]).not.toBe(first.path.split("/")[0]);
  });
  it("refuses signing against a stale image", async () => {
    await expect(
      images.createUploadUrl({ themeId: id, name: "Les Simpson", expectedImage: "stale.webp" }),
    ).rejects.toThrow(ConflictException);
    expect(storage.createSignedUploadUrl).not.toHaveBeenCalled();
  });
  it("reports signing failure without changing the theme", async () => {
    storage.createSignedUploadUrl.mockResolvedValue({ error: new Error("offline") });
    await expect(sign()).rejects.toThrow("préparer");
    expect(current.image).toBe("old.webp");
  });
  it("rejects an arbitrary path and tampered authorization", async () => {
    await expect(curation.updateTheme(id, write("arbitrary.webp"))).rejects.toThrow("invalide");
    const upload = await sign();
    await expect(
      curation.updateTheme(id, { ...write(upload.path), imageUploadToken: `${upload.token}x` }),
    ).rejects.toThrow("invalide");
    expect(repository.updateTheme).not.toHaveBeenCalled();
  });
  it("rejects replaying an upload after the image has been reset", async () => {
    const upload = await sign();
    current.updatedAt = new Date("2026-09-02T00:00:00Z");
    await expect(
      curation.updateTheme(id, { ...write(upload.path), imageUploadToken: upload.token }),
    ).rejects.toThrow("plus valide");
    expect(repository.updateTheme).not.toHaveBeenCalled();
  });
  it("rejects an expired authorization", async () => {
    const upload = await sign();
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 3 * 60 * 60 * 1000);
    await expect(
      curation.updateTheme(id, { ...write(upload.path), imageUploadToken: upload.token }),
    ).rejects.toThrow("plus valide");
    vi.restoreAllMocks();
  });
  it.each([null, {}])(
    "accepts actual Storage info through the SDK with metadata %j",
    async (metadata) => {
      const upload = await sign();
      const fetchInfo = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "object-id",
            name: upload.path,
            bucket_id: "theme-images",
            version: "version-id",
            created_at: "2026-09-16T00:00:00Z",
            content_type: "image/webp",
            size: 2 * 1024 * 1024,
            metadata,
          }),
          { headers: { "content-type": "application/json" } },
        ),
      );
      const supabase = createClient("https://storage.example", "test-key", {
        global: { fetch: fetchInfo },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const service = new ThemeImageService(
        supabase,
        testEnv,
        repository as unknown as CurationRepository,
      );
      await expect(
        service.authorize({ ...write(upload.path), imageUploadToken: upload.token }, current),
      ).resolves.toBe(id);
      expect(fetchInfo).toHaveBeenCalledWith(
        `https://storage.example/storage/v1/object/info/theme-images/${upload.path}`,
        expect.objectContaining({ method: "GET" }),
      );
    },
  );
  it("reports Storage lookup failure without blaming file size", async () => {
    const upload = await sign();
    storage.info.mockResolvedValue({
      data: null,
      error: new StorageApiError("not found", 404, "404"),
    });
    await expect(
      curation.updateTheme(id, { ...write(upload.path), imageUploadToken: upload.token }),
    ).rejects.toThrow("Impossible de vérifier");
    expect(repository.updateTheme).not.toHaveBeenCalled();
  });
  it.each([
    [{ contentType: "image/jpeg", size: 100 }, "format WebP"],
    [{ size: 2 * 1024 * 1024 + 1 }, "dépasse 2 Mo"],
    [{ size: 0 }, "vide"],
    [{ size: undefined }, "indisponible"],
    [{ size: Number.NaN }, "indisponible"],
  ])("refuses invalid stored upload info %j", async (patch, message) => {
    const upload = await sign();
    const result = await storage.info(upload.path);
    if (!result.data) throw new Error("Missing test fixture");
    storage.info.mockResolvedValue({ data: { ...result.data, ...patch }, error: null });
    await expect(
      curation.updateTheme(id, { ...write(upload.path), imageUploadToken: upload.token }),
    ).rejects.toThrow(message);
    expect(current.image).toBe("old.webp");
    expect(storage.remove).not.toHaveBeenCalled();
  });
});

describe("image persistence and cleanup", () => {
  it("checks the upload, saves its reference, then deletes the old custom image", async () => {
    const upload = await sign();
    const stored = await curation.updateTheme(id, {
      ...write(upload.path),
      imageUploadToken: upload.token,
    });
    expect(stored.image).toBe(upload.path);
    expect(events).toEqual(["verify-upload", "database", "delete"]);
    expect(storage.remove).toHaveBeenCalledWith(["old.webp"]);
  });
  it("preserves the previous image on database failure", async () => {
    const upload = await sign();
    repository.updateTheme.mockRejectedValue(new Error("database offline"));
    await expect(
      curation.updateTheme(id, { ...write(upload.path), imageUploadToken: upload.token }),
    ).rejects.toThrow("database offline");
    expect(current.image).toBe("old.webp");
    expect(storage.remove).not.toHaveBeenCalled();
  });
  it("preserves the winning image when another editor replaces it during a save", async () => {
    const upload = await sign();
    repository.updateTheme.mockImplementation(async () => {
      current.image = "winner.webp";
      throw new ConflictException();
    });
    await expect(
      curation.updateTheme(id, { ...write(upload.path), imageUploadToken: upload.token }),
    ).rejects.toThrow(ConflictException);
    expect(current.image).toBe("winner.webp");
    expect(storage.remove).not.toHaveBeenCalled();
  });
  it("keeps the saved replacement and returns a working cleanup retry after Storage failure", async () => {
    const upload = await sign();
    storage.remove.mockResolvedValueOnce({ error: new Error("offline") });
    const stored = await curation.updateTheme(id, {
      ...write(upload.path),
      imageUploadToken: upload.token,
    });
    expect(stored.image).toBe(upload.path);
    expect(stored.cleanupToken).toBeTypeOf("string");
    await images.cleanup(stored.cleanupToken ?? "");
    expect(storage.remove).toHaveBeenCalledTimes(2);
  });
  it("also offers cleanup after a network interruption", async () => {
    storage.remove.mockRejectedValue(new TypeError("fetch failed"));
    const stored = await curation.resetThemeImage(id, "old.webp");
    expect(stored.image).toBe(DEFAULT_THEME_IMAGE);
    expect(stored.cleanupToken).toBeTruthy();
  });
  it("resets immediately and deletes only after the default reference is saved", async () => {
    expect((await curation.resetThemeImage(id, "old.webp")).image).toBe(DEFAULT_THEME_IMAGE);
    expect(events).toEqual(["database", "delete"]);
  });
  it("preserves a custom image when resetting fails in the database", async () => {
    repository.updateTheme.mockRejectedValue(new Error("offline"));
    await expect(curation.resetThemeImage(id, "old.webp")).rejects.toThrow("offline");
    expect(current.image).toBe("old.webp");
    expect(storage.remove).not.toHaveBeenCalled();
  });
  it("never deletes default.webp on replacement, reset, or cleanup", async () => {
    current.image = DEFAULT_THEME_IMAGE;
    await expect(curation.resetThemeImage(id, DEFAULT_THEME_IMAGE)).rejects.toThrow("déjà");
    const upload = await sign();
    await curation.updateTheme(id, { ...write(upload.path), imageUploadToken: upload.token });
    await expect(images.cleanup(upload.token)).rejects.toThrow("ne peut pas");
    expect(storage.remove).not.toHaveBeenCalled();
  });
  it("can delete a custom image belonging to a theme whose slug is default", async () => {
    current.image = `${id}/version/default.webp`;
    await curation.resetThemeImage(id, current.image);
    expect(storage.remove).toHaveBeenCalledWith([`${id}/version/default.webp`]);
  });
  it("never deletes a custom image still referenced by a theme", async () => {
    const upload = await sign();
    await expect(images.cleanup(upload.token)).rejects.toThrow("encore utilisée");
    expect(storage.remove).not.toHaveBeenCalled();
  });
  it("creates themes with the fallback without any storage write", async () => {
    const stored = await curation.createTheme({
      name: "New",
      categoryId,
      image: DEFAULT_THEME_IMAGE,
    });
    expect(stored.image).toBe(DEFAULT_THEME_IMAGE);
    expect(storage.remove).not.toHaveBeenCalled();
    expect(storage.info).not.toHaveBeenCalled();
  });
});
