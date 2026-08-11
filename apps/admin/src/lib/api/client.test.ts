import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, endEditorSession } = vi.hoisted(() => ({
  getSession: vi.fn(),
  endEditorSession: vi.fn(() => {
    throw new Error("redirect:/sign-out?error=no-editor-access");
  }),
}));

vi.mock("@/lib/auth/editor-session", () => ({
  createEditorClient: async () => ({ auth: { getSession } }),
  endEditorSession,
}));

// redirect() throws in Next, which is what lets the seam bail mid-request.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

import { ApiError, requestJson, requestNoContent } from "@/lib/api/client";

const passThrough = { parse: (value: unknown) => value };

const fetchMock = vi.fn();

function respondWith(body: unknown, status = 200) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

function lastRequest(): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, init };
}

function headerOf(init: RequestInit, name: string): string | undefined {
  return (init.headers as Record<string, string> | undefined)?.[name];
}

beforeEach(() => {
  vi.stubEnv("API_URL", "https://api.test");
  vi.stubGlobal("fetch", fetchMock);
  getSession.mockResolvedValue({ data: { session: { access_token: "editor-token" } } });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("the seam's requests", () => {
  it("sends the editor's token as a bearer header", async () => {
    respondWith({ ok: true });

    await requestJson({ method: "GET", path: "/admin/cards" }, passThrough);

    const { url, init } = lastRequest();
    expect(url).toBe("https://api.test/admin/cards");
    expect(headerOf(init, "authorization")).toBe("Bearer editor-token");
  });

  it("drops a trailing slash from the configured API origin", async () => {
    vi.stubEnv("API_URL", "https://api.test/");
    respondWith({ ok: true });

    await requestJson({ method: "GET", path: "/admin/cards" }, passThrough);

    expect(lastRequest().url).toBe("https://api.test/admin/cards");
  });

  it("serializes query values and omits blank filters", async () => {
    respondWith({ ok: true });

    await requestJson(
      {
        method: "GET",
        path: "/admin/cards",
        query: { search: "bastille", type: undefined, tag: "", page: 2 },
      },
      passThrough,
    );

    expect(lastRequest().url).toBe("https://api.test/admin/cards?search=bastille&page=2");
  });

  it("sends a JSON body only when the request carries one", async () => {
    respondWith({ ok: true });

    await requestJson(
      { method: "POST", path: "/admin/cards", body: { title: "Une Carte" } },
      passThrough,
    );

    const { init } = lastRequest();
    expect(headerOf(init, "content-type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ title: "Une Carte" }));

    respondWith({ ok: true });
    await requestJson({ method: "GET", path: "/admin/cards" }, passThrough);
    expect(headerOf(lastRequest().init, "content-type")).toBeUndefined();
  });

  it("parses every response through its contract schema", async () => {
    respondWith({ unexpected: true });

    await expect(
      requestJson(
        { method: "GET", path: "/admin/cards" },
        {
          parse: () => {
            throw new Error("schema rejected the response");
          },
        },
      ),
    ).rejects.toThrow("schema rejected the response");
  });

  it("resolves a 204 without reading a body", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      requestNoContent({ method: "DELETE", path: "/admin/cards/abc" }),
    ).resolves.toBeUndefined();
  });
});

describe("the seam's error mapping", () => {
  it("turns an ErrorResponse envelope into an ApiError", async () => {
    respondWith(
      {
        statusCode: 404,
        error: "Not Found",
        message: "Card not found",
        code: "NOT_FOUND",
      },
      404,
    );

    const error = await requestJson({ method: "GET", path: "/admin/cards/abc" }, passThrough).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ statusCode: 404, code: "NOT_FOUND", message: "Card not found" });
  });

  it("falls back to INTERNAL when the body is not an ErrorResponse", async () => {
    fetchMock.mockResolvedValue(new Response("<html>gateway</html>", { status: 502 }));

    const error = await requestJson({ method: "GET", path: "/admin/cards" }, passThrough).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ statusCode: 502, code: "INTERNAL" });
  });

  it("redirects to the login page on UNAUTHENTICATED", async () => {
    respondWith(
      { statusCode: 401, error: "Unauthorized", message: "No token", code: "UNAUTHENTICATED" },
      401,
    );

    await expect(requestJson({ method: "GET", path: "/admin/cards" }, passThrough)).rejects.toThrow(
      "redirect:/login",
    );
  });

  it("ends the session on FORBIDDEN, since login already gated on the claim", async () => {
    respondWith(
      { statusCode: 403, error: "Forbidden", message: "Not an editor", code: "FORBIDDEN" },
      403,
    );

    // The sign-out has to travel through a route handler: an RSC cannot clear cookies.
    await expect(requestJson({ method: "GET", path: "/admin/cards" }, passThrough)).rejects.toThrow(
      "redirect:/sign-out?error=no-editor-access",
    );
    expect(endEditorSession).toHaveBeenCalledOnce();
  });

  it("redirects to the login page without calling the API when no token is stored", async () => {
    getSession.mockResolvedValue({ data: { session: null } });

    await expect(requestJson({ method: "GET", path: "/admin/cards" }, passThrough)).rejects.toThrow(
      "redirect:/login",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails loudly when API_URL is missing", async () => {
    vi.stubEnv("API_URL", "");

    await expect(requestJson({ method: "GET", path: "/admin/cards" }, passThrough)).rejects.toThrow(
      "API_URL must be set",
    );
  });
});
