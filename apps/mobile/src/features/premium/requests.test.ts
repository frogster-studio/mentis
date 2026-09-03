import { describe, expect, it, vi } from "vitest";
import { type ApiClient, createApiClient } from "@/lib/api/client";
import { fetchPremium, premiumRequest } from "./requests";

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

describe("the premium request", () => {
  it("sits under the guarded /app/me prefix, so every call carries the token", () => {
    expect(premiumRequest.path.startsWith("/app/me/")).toBe(true);
  });

  it("addresses the premium read endpoint", () => {
    expect(premiumRequest).toStrictEqual({ method: "GET", path: "/app/me/premium" });
  });
});

describe("fetchPremium", () => {
  it("parses the server's active + until response", async () => {
    const until = "2027-01-01T00:00:00.000Z";
    const { api, calls } = client({ active: true, until });

    const response = await fetchPremium(api);

    expect(response).toEqual({ active: true, until });
    expect(calls[0].url).toBe(`${BASE_URL}/app/me/premium`);
  });

  it("parses an inactive response with a null until", async () => {
    const { api } = client({ active: false, until: null });

    await expect(fetchPremium(api)).resolves.toEqual({ active: false, until: null });
  });

  it("throws when the payload drifts from the contract", async () => {
    const { api } = client({ active: "yes", until: null });

    await expect(fetchPremium(api)).rejects.toThrow();
  });
});
