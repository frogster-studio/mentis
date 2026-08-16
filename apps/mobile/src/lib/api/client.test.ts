import { appThemeListResponseSchema } from "@mentis/contracts/app";
import type { ErrorResponse } from "@mentis/contracts/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type ApiClient, ApiError, createApiClient, isApiError } from "./client";

const BASE_URL = "https://api.test";

type Call = { url: string; init: RequestInit };

function stubFetch(responses: Response[]) {
  const calls: Call[] = [];
  const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    const response = responses.shift();
    if (!response) throw new Error("unexpected extra fetch call");
    return response;
  });
  return { fetch: fetch as unknown as typeof globalThis.fetch, calls };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function errorResponse(code: ErrorResponse["code"], statusCode: number): Response {
  return jsonResponse(
    { statusCode, error: "Error", message: "boom", code } satisfies ErrorResponse,
    statusCode,
  );
}

function headerOf(call: Call, name: string): string | undefined {
  return (call.init.headers as Record<string, string> | undefined)?.[name];
}

const onUnauthenticated = vi.fn();
const getToken = vi.fn(async () => "token-abc" as string | null);

function client(responses: Response[]): { api: ApiClient; calls: Call[] } {
  const { fetch, calls } = stubFetch(responses);
  return {
    api: createApiClient({ baseUrl: BASE_URL, fetch, getToken, onUnauthenticated }),
    calls,
  };
}

beforeEach(() => {
  onUnauthenticated.mockClear();
  getToken.mockClear();
  getToken.mockResolvedValue("token-abc");
});

describe("the token boundary", () => {
  it("sends no Authorization on a public read, so signed-in and signed-out are identical", async () => {
    const { api, calls } = client([jsonResponse([])]);

    await api.requestJson({ method: "GET", path: "/app/themes" }, appThemeListResponseSchema);

    expect(headerOf(calls[0], "authorization")).toBeUndefined();
    // Not merely absent from the header — the session is never even consulted.
    expect(getToken).not.toHaveBeenCalled();
  });

  it("attaches the bearer token on a guarded call", async () => {
    const { api, calls } = client([new Response(null, { status: 204 })]);

    await api.requestNoContent({ method: "POST", path: "/app/me/quiz-sessions", body: [] });

    expect(headerOf(calls[0], "authorization")).toBe("Bearer token-abc");
  });

  it("still calls a guarded route with no token, and lets the server answer", async () => {
    getToken.mockResolvedValue(null);
    const { api, calls } = client([new Response(null, { status: 204 })]);

    await api.requestNoContent({ method: "DELETE", path: "/app/me/account" });

    expect(headerOf(calls[0], "authorization")).toBeUndefined();
    expect(calls).toHaveLength(1);
  });
});

describe("serialization", () => {
  it("appends query values and drops the empty ones", async () => {
    const { api, calls } = client([jsonResponse([])]);

    await api.requestJson(
      { method: "GET", path: "/app/questions", query: { theme: "histoire", n: undefined } },
      appThemeListResponseSchema,
    );

    expect(calls[0].url).toBe(`${BASE_URL}/app/questions?theme=histoire`);
  });

  it("sends no query string at all when every value is absent", async () => {
    const { api, calls } = client([jsonResponse([])]);

    await api.requestJson(
      { method: "GET", path: "/app/questions", query: { theme: "" } },
      appThemeListResponseSchema,
    );

    expect(calls[0].url).toBe(`${BASE_URL}/app/questions`);
  });

  it("JSON-encodes a body and declares its content type", async () => {
    const { api, calls } = client([new Response(null, { status: 204 })]);
    const rows = [{ id: "a", themeId: "histoire", themeName: "Histoire", points: 3 }];

    await api.requestNoContent({ method: "POST", path: "/app/me/quiz-sessions", body: rows });

    expect(calls[0].init.body).toBe(JSON.stringify(rows));
    expect(headerOf(calls[0], "content-type")).toBe("application/json");
  });

  it("trims a trailing slash off the base URL rather than doubling it", async () => {
    const { fetch, calls } = stubFetch([jsonResponse([])]);
    const api = createApiClient({
      baseUrl: `${BASE_URL}/`,
      fetch,
      getToken,
      onUnauthenticated,
    });

    await api.requestJson({ method: "GET", path: "/app/themes" }, appThemeListResponseSchema);

    expect(calls[0].url).toBe(`${BASE_URL}/app/themes`);
  });
});

describe("contract parsing", () => {
  it("returns the parsed response", async () => {
    const themes = [{ id: "histoire", name: "Histoire", questionCount: 12 }];
    const { api } = client([jsonResponse(themes)]);

    await expect(
      api.requestJson({ method: "GET", path: "/app/themes" }, appThemeListResponseSchema),
    ).resolves.toEqual(themes);
  });

  it("throws when the payload drifts from the contract, instead of passing it on", async () => {
    const { api } = client([jsonResponse([{ id: "histoire", name: "Histoire" }])]);

    await expect(
      api.requestJson({ method: "GET", path: "/app/themes" }, appThemeListResponseSchema),
    ).rejects.toThrow();
  });

  it("never reads a body on 204", async () => {
    const { api } = client([new Response(null, { status: 204 })]);

    await expect(
      api.requestNoContent({ method: "DELETE", path: "/app/me/account" }),
    ).resolves.toBeUndefined();
  });
});

describe("errors", () => {
  it("turns an ErrorResponse envelope into an ApiError carrying its code", async () => {
    const { api } = client([errorResponse("THEME_NOT_FOUND", 404)]);

    const error = await api
      .requestJson({ method: "GET", path: "/app/questions" }, appThemeListResponseSchema)
      .catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(ApiError);
    expect(isApiError(error, "THEME_NOT_FOUND")).toBe(true);
    expect((error as ApiError).statusCode).toBe(404);
  });

  it("degrades an unparseable error body to INTERNAL rather than throwing over the failure", async () => {
    const { api } = client([new Response("<html>502</html>", { status: 502 })]);

    const error = await api
      .requestJson({ method: "GET", path: "/app/themes" }, appThemeListResponseSchema)
      .catch((thrown: unknown) => thrown);

    expect(isApiError(error, "INTERNAL")).toBe(true);
    expect((error as ApiError).statusCode).toBe(502);
  });

  it("signs the Player out on UNAUTHENTICATED — the session is unrecoverable, so no retry", async () => {
    const { api, calls } = client([errorResponse("UNAUTHENTICATED", 401)]);

    await expect(
      api.requestNoContent({ method: "POST", path: "/app/me/stat-baselines", body: [] }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(onUnauthenticated).toHaveBeenCalledOnce();
    expect(calls).toHaveLength(1);
  });

  it("does not sign out on a 401 from a public read — it says nothing about the session", async () => {
    const { api } = client([errorResponse("UNAUTHENTICATED", 401)]);

    await expect(
      api.requestJson({ method: "GET", path: "/app/themes" }, appThemeListResponseSchema),
    ).rejects.toBeInstanceOf(ApiError);

    expect(onUnauthenticated).not.toHaveBeenCalled();
  });

  it("maps a deleted Account to ACCOUNT_GONE — the outbox's only discard trigger", async () => {
    const { api } = client([errorResponse("ACCOUNT_GONE", 410)]);

    const error = await api
      .requestNoContent({ method: "POST", path: "/app/me/quiz-sessions", body: [] })
      .catch((thrown: unknown) => thrown);

    expect(isApiError(error, "ACCOUNT_GONE")).toBe(true);
    // A gone Account is not a dead session: the sign-out belongs to 401 alone.
    expect(onUnauthenticated).not.toHaveBeenCalled();
  });

  it("leaves every other failure alone — RATE_LIMITED throws without signing out", async () => {
    const { api } = client([errorResponse("RATE_LIMITED", 429)]);

    const error = await api
      .requestJson({ method: "GET", path: "/app/themes" }, appThemeListResponseSchema)
      .catch((thrown: unknown) => thrown);

    expect(isApiError(error, "RATE_LIMITED")).toBe(true);
    expect(onUnauthenticated).not.toHaveBeenCalled();
  });
});
