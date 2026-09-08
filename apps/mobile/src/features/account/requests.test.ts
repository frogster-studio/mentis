import { describe, expect, it, vi } from "vitest";
import { type ApiClient, ApiError, createApiClient } from "@/lib/api/client";
import { fetchProfile, profileRequest, setPseudo, setPseudoRequest } from "./requests";

const BASE_URL = "https://api.test";

type Call = { url: string; init: RequestInit };

function client(body: unknown, status = 200): { api: ApiClient; calls: Call[] } {
  const calls: Call[] = [];
  const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  });
  return {
    api: createApiClient({
      baseUrl: BASE_URL,
      fetch: fetch as unknown as typeof globalThis.fetch,
      getToken: async () => "token-abc",
      onUnauthenticated: vi.fn(),
    }),
    calls,
  };
}

describe("the profile paths", () => {
  it("both sit under the guarded /app/me prefix, so every call carries the token", () => {
    for (const request of [profileRequest, setPseudoRequest("Eleonore48213")]) {
      expect(request.path.startsWith("/app/me/")).toBe(true);
    }
  });

  it("read and write each address their own endpoint", () => {
    expect(profileRequest).toStrictEqual({ method: "GET", path: "/app/me/profile" });
    expect(setPseudoRequest("Eleonore48213")).toStrictEqual({
      method: "PUT",
      path: "/app/me/pseudo",
      body: { pseudo: "Eleonore48213" },
    });
  });
});

describe("fetchProfile", () => {
  it("parses the pseudo the API names the Account with", async () => {
    const { api, calls } = client({ pseudo: "Eleonore48213" });

    await expect(fetchProfile(api)).resolves.toStrictEqual({ pseudo: "Eleonore48213" });
    expect(calls[0].url).toBe(`${BASE_URL}/app/me/profile`);
  });

  it("refuses a pseudo the contract would reject", async () => {
    const { api } = client({ pseudo: "Jean-Pierre" });

    await expect(fetchProfile(api)).rejects.toThrow();
  });
});

describe("setPseudo", () => {
  it("sends the pseudo as typed and answers what the API stored", async () => {
    const { api, calls } = client({ pseudo: "ELEONORE" });

    await expect(setPseudo(api, "ELEONORE")).resolves.toStrictEqual({ pseudo: "ELEONORE" });
    expect(JSON.parse(String(calls[0].init.body))).toStrictEqual({ pseudo: "ELEONORE" });
  });

  it("surfaces a taken pseudo as PSEUDO_TAKEN, so the Sheet can name that failure alone", async () => {
    const { api } = client(
      {
        statusCode: 409,
        error: "Conflict",
        message: "This pseudo is already taken.",
        code: "PSEUDO_TAKEN",
      },
      409,
    );

    await expect(setPseudo(api, "Eleonore")).rejects.toMatchObject({
      code: "PSEUDO_TAKEN",
      statusCode: 409,
    });
    await expect(setPseudo(api, "Eleonore")).rejects.toBeInstanceOf(ApiError);
  });
});
