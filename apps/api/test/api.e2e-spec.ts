import { adminCardListResponseSchema } from "@mentis/contracts/admin";
import { appAccountStatsResponseSchema } from "@mentis/contracts/app";
import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ENV, type Env } from "../src/env";
import { RootModule } from "../src/root.module";
import { SUPABASE } from "../src/supabase";

// ── stub tokens ─────────────────────────────────────────────────────────────
// The skeleton guard decodes without verifying (see src/auth), so tests mint
// unsigned JWTs with the claim shapes Supabase Auth would produce.
const b64url = (value: object): string => Buffer.from(JSON.stringify(value)).toString("base64url");
const stubJwt = (claims: Record<string, unknown>): string =>
  `${b64url({ alg: "ES256", typ: "JWT" })}.${b64url(claims)}.${b64url({ sig: "stub" })}`;

const PLAYER_SUB = "11111111-1111-4111-8111-111111111111";
const playerToken = stubJwt({
  sub: PLAYER_SUB,
  role: "authenticated",
  email: "player@example.com",
});
const editorToken = stubJwt({
  sub: "22222222-2222-4222-8222-222222222222",
  role: "authenticated",
  email: "editor@example.com",
  app_metadata: { role: "editor" },
});

// ── fake supabase ───────────────────────────────────────────────────────────
// Rows are stored in the wire shape the aliased selects produce; the fake only
// records which filters each query applied.
const cardRow = {
  id: "33333333-3333-4333-8333-333333333333",
  type: "quiz",
  title: "Roman aqueducts",
  tags: ["history"],
  postedOn: ["x"],
  payload: {},
  images: [],
  createdAt: "2026-08-01T10:00:00+00:00",
  updatedAt: "2026-08-02T10:00:00+00:00",
};
const baselineRow = {
  device: "44444444-4444-4444-8444-444444444444",
  themeId: "history",
  themeName: "History",
  totalPoints: 120,
  sessionCount: 3,
};
const sessionRow = {
  id: "55555555-5555-4555-8555-555555555555",
  themeId: "history",
  themeName: "History",
  points: 40,
  finishedAt: "2026-07-30T18:00:00+00:00",
};

interface RecordedQuery {
  table: string;
  filters: Array<[string, unknown]>;
}

type FakeResult = { data: unknown[]; count: number | null; error: null };

class FakeQuery implements PromiseLike<FakeResult> {
  private readonly filters: Array<[string, unknown]> = [];

  constructor(
    private readonly table: string,
    private readonly rows: unknown[],
    private readonly recorded: RecordedQuery[],
  ) {}

  select(_columns: string, _options?: { count?: string }): this {
    return this;
  }
  eq(column: string, value: unknown): this {
    this.filters.push([column, value]);
    return this;
  }
  ilike(): this {
    return this;
  }
  contains(): this {
    return this;
  }
  order(): this {
    return this;
  }
  range(): this {
    return this;
  }

  // biome-ignore lint/suspicious/noThenProperty: supabase query builders are awaitable thenables; the fake mirrors that
  then<TResult1 = FakeResult, TResult2 = never>(
    onfulfilled?: ((value: FakeResult) => TResult1 | PromiseLike<TResult1>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    this.recorded.push({ table: this.table, filters: this.filters });
    const result: FakeResult = { data: this.rows, count: this.rows.length, error: null };
    return Promise.resolve(onfulfilled ? onfulfilled(result) : (result as TResult1));
  }
}

const recordedQueries: RecordedQuery[] = [];
const tables: Record<string, unknown[]> = {
  cards: [cardRow],
  stat_baselines: [baselineRow],
  quiz_sessions: [sessionRow],
};
const fakeSupabase = {
  from: (table: string) => new FakeQuery(table, tables[table] ?? [], recordedQueries),
};

const testEnv: Env = {
  NODE_ENV: "test",
  PORT: 0,
  SUPABASE_URL: "https://stub.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_stub",
  CORS_ORIGINS: "",
};

// ── the walking skeleton, end to end over real HTTP ─────────────────────────
describe("walking skeleton e2e", () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [RootModule] })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(SUPABASE)
      .useValue(fakeSupabase)
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health is public and ok", async () => {
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("GET /admin/cards without a token → 401 UNAUTHENTICATED envelope", async () => {
    const response = await fetch(`${baseUrl}/admin/cards`);
    expect(response.status).toBe(401);
    const body = errorResponseSchema.parse(await response.json());
    expect(body.code).toBe("UNAUTHENTICATED");
  });

  it("GET /admin/cards with a garbage token → 401", async () => {
    const response = await fetch(`${baseUrl}/admin/cards`, {
      headers: { authorization: "Bearer not.a.jwt" },
    });
    expect(response.status).toBe(401);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
  });

  it("GET /admin/cards with a player token → 403 FORBIDDEN (authenticated, not authorized)", async () => {
    const response = await fetch(`${baseUrl}/admin/cards`, {
      headers: { authorization: `Bearer ${playerToken}` },
    });
    expect(response.status).toBe(403);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("FORBIDDEN");
  });

  it("GET /admin/cards?page=0 with an editor token → 400 VALIDATION_FAILED with details", async () => {
    const response = await fetch(`${baseUrl}/admin/cards?page=0`, {
      headers: { authorization: `Bearer ${editorToken}` },
    });
    expect(response.status).toBe(400);
    const body = errorResponseSchema.parse(await response.json());
    expect(body.code).toBe("VALIDATION_FAILED");
    expect(body.details).toBeDefined();
  });

  it("GET /admin/cards with an editor token → 200, contract-valid, camelCase wire", async () => {
    const response = await fetch(`${baseUrl}/admin/cards`, {
      headers: { authorization: `Bearer ${editorToken}` },
    });
    expect(response.status).toBe(200);
    const body = adminCardListResponseSchema.parse(await response.json());
    expect(body.items[0]?.title).toBe("Roman aqueducts");
    expect(body.total).toBe(1);
    expect(body.pageSize).toBe(20);
  });

  it("GET /app/me/stats without a token → 401", async () => {
    const response = await fetch(`${baseUrl}/app/me/stats`);
    expect(response.status).toBe(401);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
  });

  it("GET /app/me/stats with a player token → 200, owner-scoped from the JWT", async () => {
    recordedQueries.length = 0;
    const response = await fetch(`${baseUrl}/app/me/stats`, {
      headers: { authorization: `Bearer ${playerToken}` },
    });
    expect(response.status).toBe(200);
    const body = appAccountStatsResponseSchema.parse(await response.json());
    expect(body.baselines).toHaveLength(1);
    expect(body.sessions).toHaveLength(1);

    // The RLS owner-scoping, re-implemented API-side: every player-table query
    // must carry the JWT sub as the owner filter.
    const playerTableQueries = recordedQueries.filter((q) => q.table !== "cards");
    expect(playerTableQueries).toHaveLength(2);
    for (const query of playerTableQueries) {
      expect(query.filters).toContainEqual(["owner", PLAYER_SUB]);
    }
  });
});
