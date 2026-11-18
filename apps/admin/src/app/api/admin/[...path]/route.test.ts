import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lossy } from "@/features/curation/webp-fixtures";

vi.mock("@/lib/auth/editor-session", () => ({
  createEditorClient: async () => ({
    auth: { getSession: async () => ({ data: { session: { access_token: "editor-token" } } }) },
  }),
}));

import { PATCH, POST, PUT } from "@/app/api/admin/[...path]/route";

const ANECDOTE_ID = "3f0c1a52-6a0f-4d8e-9b8a-0c7d2e5f1a90";

function context(...path: string[]) {
  return { params: Promise.resolve({ path }) };
}

function forwarded() {
  const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
  return { url, init, headers: init.headers as Record<string, string> };
}

beforeEach(() => {
  vi.stubEnv("API_URL", "https://api.test/");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ id: ANECDOTE_ID })));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("the admin proxy", () => {
  it("forwards an image PUT byte-identical with its own Content-Type", async () => {
    const image = lossy(750, 1024);
    const request = new NextRequest(`https://admin.test/api/admin/anecdotes/${ANECDOTE_ID}/image`, {
      method: "PUT",
      headers: { "content-type": "image/webp" },
      body: image,
    });

    const response = await PUT(request, context("anecdotes", ANECDOTE_ID, "image"));

    const { url, init, headers } = forwarded();
    expect(url).toBe(`https://api.test/admin/anecdotes/${ANECDOTE_ID}/image`);
    expect(init.method).toBe("PUT");
    expect(headers).toEqual({ authorization: "Bearer editor-token", "content-type": "image/webp" });
    expect(new Uint8Array(init.body as ArrayBuffer)).toEqual(image);
    expect(await response.json()).toEqual({ id: ANECDOTE_ID });
  });

  it.each([
    ["POST", POST, "/anecdotes"],
    ["PATCH", PATCH, `/anecdotes/${ANECDOTE_ID}`],
  ])("forwards a JSON %s as JSON", async (method, handler, path) => {
    const json = JSON.stringify({ text: "Le **Mont Blanc** culmine à 4 806 m." });
    const request = new NextRequest(`https://admin.test/api/admin${path}?q=x`, {
      method,
      headers: { "content-type": "application/json" },
      body: json,
    });

    await handler(request, context(...path.slice(1).split("/")));

    const { url, init, headers } = forwarded();
    expect(url).toBe(`https://api.test/admin${path}?q=x`);
    expect(init.method).toBe(method);
    expect(headers).toEqual({
      authorization: "Bearer editor-token",
      "content-type": "application/json",
    });
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe(json);
  });
});
