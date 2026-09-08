import { LEADERBOARD_PAGE_SIZE } from "@mentis/contracts/app";
import { describe, expect, it, vi } from "vitest";
import { type ApiClient, createApiClient } from "@/lib/api/client";
import { fetchLeaderboardPage, leaderboardPageRequest } from "./requests";

const BASE_URL = "https://api.test";

type Call = { url: string; init: RequestInit };

function client(body: unknown): { api: ApiClient; calls: Call[] } {
  const calls: Call[] = [];
  const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response(JSON.stringify(body), {
      status: 200,
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

function page(entryCount: number) {
  return {
    season: "2026-09",
    page: 1,
    pageCount: 2,
    entries: Array.from({ length: entryCount }, (_, index) => ({
      rank: index + 1,
      pseudo: `Joueur${String(index).padStart(5, "0")}`,
      seasonTotal: 400 - index,
    })),
  };
}

describe("the leaderboard request", () => {
  it("stays outside /app/me, so a signed-out Player reads it with no token", async () => {
    const request = leaderboardPageRequest(1);
    expect(request.path.startsWith("/app/me")).toBe(false);

    const { api, calls } = client(page(1));
    await fetchLeaderboardPage(api, 1);

    expect(calls[0].init.headers).toStrictEqual({});
  });

  it("carries the asked page as a query parameter", async () => {
    expect(leaderboardPageRequest(3)).toStrictEqual({
      method: "GET",
      path: "/app/competition/leaderboard",
      query: { page: "3" },
    });

    const { api, calls } = client(page(1));
    await fetchLeaderboardPage(api, 3);

    expect(calls[0].url).toBe(`${BASE_URL}/app/competition/leaderboard?page=3`);
  });
});

describe("fetchLeaderboardPage", () => {
  it("parses a full page of ranked Accounts", async () => {
    const { api } = client(page(LEADERBOARD_PAGE_SIZE));

    const response = await fetchLeaderboardPage(api, 1);

    expect(response.entries).toHaveLength(LEADERBOARD_PAGE_SIZE);
    expect(response.entries[0]).toStrictEqual({
      rank: 1,
      pseudo: "Joueur00000",
      seasonTotal: 400,
    });
  });

  it("parses a Season nobody is ranked in", async () => {
    const { api } = client({ season: "2026-09", page: 1, pageCount: 0, entries: [] });

    await expect(fetchLeaderboardPage(api, 1)).resolves.toStrictEqual({
      season: "2026-09",
      page: 1,
      pageCount: 0,
      entries: [],
    });
  });

  it("refuses a page the API did not shape", async () => {
    const { api } = client({ ...page(1), pageCount: -1 });

    await expect(fetchLeaderboardPage(api, 1)).rejects.toThrow();
  });
});
