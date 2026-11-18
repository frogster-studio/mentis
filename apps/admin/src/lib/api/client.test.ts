import { adminAnecdoteResponseSchema } from "@mentis/contracts/admin";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lossy, webpFile } from "@/features/curation/webp-fixtures";
import { deleteFromApi, putFileToApi } from "@/lib/api/client";

const anecdote = {
  id: "3f0c1a52-6a0f-4d8e-9b8a-0c7d2e5f1a90",
  text: "Le **Mont Blanc** culmine à 4 806 m.",
  image: "anecdotes/3f0c1a52.webp",
};

function sent() {
  const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
  return { url, init, headers: init.headers as Record<string, string> };
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
afterEach(() => vi.unstubAllGlobals());

describe("putFileToApi", () => {
  it("sends the file as dropped and parses the answer with the contract", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ ...anecdote, extra: "dropped" }));
    const file = webpFile(lossy(750, 1024));

    const saved = await putFileToApi(
      `/anecdotes/${anecdote.id}/image`,
      file,
      adminAnecdoteResponseSchema,
    );

    expect(saved).toEqual(anecdote);
    const { url, init, headers } = sent();
    expect(url).toBe(`/api/admin/anecdotes/${anecdote.id}/image`);
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(file);
    expect(headers).toEqual({ "content-type": "image/webp" });
  });

  it("labels a file the browser gave no MIME type as raw bytes", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json(anecdote));

    await putFileToApi(
      "/anecdotes/x/image",
      new Blob([lossy(750, 1024)]),
      adminAnecdoteResponseSchema,
    );

    expect(sent().headers).toEqual({ "content-type": "application/octet-stream" });
  });

  it("rejects with the API's French message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        {
          statusCode: 400,
          error: "Bad Request",
          message: "L’image doit être un fichier WebP.",
          code: "VALIDATION_FAILED",
        },
        { status: 400 },
      ),
    );

    await expect(
      putFileToApi("/anecdotes/x/image", new Blob(["png"]), adminAnecdoteResponseSchema),
    ).rejects.toThrow("L’image doit être un fichier WebP.");
  });
});

describe("deleteFromApi", () => {
  it("resolves on a 204 answer", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deleteFromApi(`/anecdotes/${anecdote.id}`)).resolves.toBeUndefined();
    expect(sent().init.method).toBe("DELETE");
  });
});
