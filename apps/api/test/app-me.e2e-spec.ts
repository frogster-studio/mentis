import { MAX_PUSH_BATCH } from "@mentis/contracts/app";
import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from "jose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { JWKS } from "../src/auth/jwks";
import { ENV } from "../src/env";
import { RootModule } from "../src/root.module";
import { SUPABASE } from "../src/supabase";
import { stubDataSource, testEnv } from "./test-env";

const PLAYER_A = "11111111-1111-4111-8111-111111111111";
const PLAYER_B = "22222222-2222-4222-8222-222222222222";
const DEVICE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DEVICE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SESSION_1 = "10000000-0000-4000-8000-000000000001";
const SESSION_2 = "10000000-0000-4000-8000-000000000002";
const SESSION_3 = "10000000-0000-4000-8000-000000000003";

type SessionRow = {
  id: string;
  owner: string;
  theme_id: string;
  theme_name: string;
  points: number;
  finished_at: string;
};

type BaselineRow = {
  owner: string;
  device: string;
  theme_id: string;
  theme_name: string;
  total_points: number;
  session_count: number;
};

type UpsertOptions = { onConflict?: string; ignoreDuplicates?: boolean };

let sessionRows: SessionRow[] = [];
let baselineRows: BaselineRow[] = [];
let liveOwners = new Set<string>();
let upserts: (UpsertOptions & { table: string })[] = [];

const OWNER_GONE_ERROR = {
  code: "23503",
  message: 'insert violates foreign key constraint "quiz_sessions_owner_fkey"',
  details: "",
  hint: "",
};

const sessionRow = (
  id: string,
  owner: string,
  overrides: Partial<SessionRow> = {},
): SessionRow => ({
  id,
  owner,
  theme_id: "geo",
  theme_name: "Géographie",
  points: 30,
  finished_at: "2026-08-11T10:00:00.000Z",
  ...overrides,
});

const baselineRow = (owner: string, overrides: Partial<BaselineRow> = {}): BaselineRow => ({
  owner,
  device: DEVICE_A,
  theme_id: "geo",
  theme_name: "Géographie",
  total_points: 120,
  session_count: 4,
  ...overrides,
});

// The aliased camelCase select strings are proven by the live smoke, so the stub projects by hand.
const projectSessions = (rows: SessionRow[]) =>
  rows.map((row) => ({
    id: row.id,
    themeId: row.theme_id,
    themeName: row.theme_name,
    points: row.points,
  }));

const projectBaselines = (rows: BaselineRow[]) =>
  rows.map((row) => ({
    themeId: row.theme_id,
    themeName: row.theme_name,
    totalPoints: row.total_points,
    sessionCount: row.session_count,
  }));

// on-conflict-do-nothing over the in-memory table, and the owner FK that rejects a deleted Account.
const upsertInto = <Row extends { owner: string }>(
  table: string,
  stored: Row[],
  rows: Row[],
  options: UpsertOptions,
  clashes: (existing: Row, row: Row) => boolean,
) => {
  upserts.push({ table, ...options });
  if (rows.some((row) => !liveOwners.has(row.owner))) {
    return Promise.resolve({ data: null, error: OWNER_GONE_ERROR });
  }
  for (const row of rows) {
    const clash = stored.findIndex((existing) => clashes(existing, row));
    if (clash === -1) {
      stored.push(row);
    } else if (options.ignoreDuplicates !== true) {
      stored[clash] = row;
    }
  }
  return Promise.resolve({ data: null, error: null });
};

// Stands in for PostgREST: owner filtering, ordering and on-conflict-do-nothing with real semantics.
const stubSupabase = {
  from: (table: string) => {
    if (table === "quiz_sessions") {
      return {
        select: () => ({
          eq: (_column: string, owner: string) => {
            const rows = sessionRows.filter((row) => row.owner === owner);
            return Object.assign(Promise.resolve({ data: projectSessions(rows), error: null }), {
              order: (column: string, options: { ascending: boolean }) => {
                if (column !== "finished_at") {
                  throw new Error(`unexpected order column ${column}`);
                }
                const direction = options.ascending ? 1 : -1;
                const sorted = [...rows].sort(
                  (left, right) => direction * left.finished_at.localeCompare(right.finished_at),
                );
                return Promise.resolve({ data: projectSessions(sorted), error: null });
              },
            });
          },
        }),
        upsert: (rows: SessionRow[], options: UpsertOptions) =>
          upsertInto(table, sessionRows, rows, options, (existing, row) => existing.id === row.id),
      };
    }
    if (table === "stat_baselines") {
      return {
        select: () => ({
          eq: (_column: string, owner: string) =>
            Promise.resolve({
              data: projectBaselines(baselineRows.filter((row) => row.owner === owner)),
              error: null,
            }),
        }),
        upsert: (rows: BaselineRow[], options: UpsertOptions) =>
          upsertInto(
            table,
            baselineRows,
            rows,
            options,
            (existing, row) =>
              existing.owner === row.owner &&
              existing.device === row.device &&
              existing.theme_id === row.theme_id,
          ),
      };
    }
    throw new Error(`unexpected table ${table}`);
  },
  auth: {
    admin: {
      // The owner FK cascade, in memory.
      deleteUser: (id: string) => {
        liveOwners.delete(id);
        sessionRows = sessionRows.filter((row) => row.owner !== id);
        baselineRows = baselineRows.filter((row) => row.owner !== id);
        return Promise.resolve({ data: { user: null }, error: null });
      },
    },
  },
};

const pushedSession = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  themeId: "geo",
  themeName: "Géographie",
  points: 30,
  finishedAt: "2026-08-11T10:00:00.000Z",
  ...overrides,
});

const batchSessionId = (index: number) =>
  `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`;

const pushedBaseline = (overrides: Record<string, unknown> = {}) => ({
  device: DEVICE_A,
  themeId: "geo",
  themeName: "Géographie",
  totalPoints: 120,
  sessionCount: 4,
  ...overrides,
});

describe("app me routes e2e", () => {
  let app: INestApplication;
  let baseUrl: string;
  let tokenA: string;
  let tokenB: string;

  const authed = (token: string, path: string, init: RequestInit = {}) =>
    fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
    });

  const push = (token: string, path: string, body: unknown) =>
    authed(token, path, { method: "POST", body: JSON.stringify(body) });

  beforeAll(async () => {
    const signingKey = await generateKeyPair("ES256", { extractable: true });
    const publicJwk = { ...(await exportJWK(signingKey.publicKey)), alg: "ES256", kid: "test-key" };
    const mint = (sub: string): Promise<string> =>
      new SignJWT({
        iss: `${testEnv.SUPABASE_URL}/auth/v1`,
        aud: "authenticated",
        sub,
        role: "authenticated",
      } satisfies JWTPayload)
        .setProtectedHeader({ alg: "ES256", kid: "test-key" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(signingKey.privateKey);
    tokenA = await mint(PLAYER_A);
    tokenB = await mint(PLAYER_B);

    const moduleRef = await Test.createTestingModule({ imports: [RootModule] })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(getDataSourceToken())
      .useValue(stubDataSource)
      .overrideProvider(SUPABASE)
      .useValue(stubSupabase)
      .overrideProvider(JWKS)
      .useValue(createLocalJWKSet({ keys: [publicJwk] }))
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    sessionRows = [];
    baselineRows = [];
    liveOwners = new Set([PLAYER_A, PLAYER_B]);
    upserts = [];
  });

  it.each([
    ["GET", "/app/me/stats"],
    ["POST", "/app/me/quiz-sessions"],
    ["POST", "/app/me/stat-baselines"],
    ["DELETE", "/app/me/account"],
  ])("%s %s without a token → 401 UNAUTHENTICATED", async (method, path) => {
    const response = await fetch(`${baseUrl}${path}`, { method });
    expect(response.status).toBe(401);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
  });

  it("GET /app/me/stats returns the owner's world, sessions finishedAt asc, owner off the wire", async () => {
    sessionRows.push(
      sessionRow(SESSION_2, PLAYER_A, { finished_at: "2026-08-11T12:00:00.000Z", points: 20 }),
      sessionRow(SESSION_1, PLAYER_A, { finished_at: "2026-08-11T09:00:00.000Z", points: 10 }),
      sessionRow(SESSION_3, PLAYER_A, { finished_at: "2026-08-11T15:00:00.000Z", points: 30 }),
    );
    baselineRows.push(baselineRow(PLAYER_A));

    const response = await authed(tokenA, "/app/me/stats");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sessions.map((session: { id: string }) => session.id)).toEqual([
      SESSION_1,
      SESSION_2,
      SESSION_3,
    ]);
    expect(body.sessions[0]).toEqual({
      id: SESSION_1,
      themeId: "geo",
      themeName: "Géographie",
      points: 10,
    });
    expect(body.baselines).toEqual([
      { themeId: "geo", themeName: "Géographie", totalPoints: 120, sessionCount: 4 },
    ]);
    expect(JSON.stringify(body)).not.toContain("owner");
  });

  it("GET /app/me/stats never returns another Player's rows", async () => {
    sessionRows.push(sessionRow(SESSION_1, PLAYER_B));
    baselineRows.push(baselineRow(PLAYER_B));

    const response = await authed(tokenA, "/app/me/stats");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ baselines: [], sessions: [] });
  });

  it("POST /app/me/quiz-sessions stores the batch under the JWT sub, ignoring a body owner", async () => {
    const response = await push(tokenA, "/app/me/quiz-sessions", [
      pushedSession(SESSION_1, { owner: PLAYER_B }),
    ]);
    expect(response.status).toBe(204);
    expect(sessionRows).toEqual([sessionRow(SESSION_1, PLAYER_A)]);
    expect(upserts).toEqual([{ table: "quiz_sessions", onConflict: "id", ignoreDuplicates: true }]);
  });

  it("re-pushing an accepted Quiz Session is a no-op success", async () => {
    await push(tokenA, "/app/me/quiz-sessions", [pushedSession(SESSION_1)]);
    const again = await push(tokenA, "/app/me/quiz-sessions", [
      pushedSession(SESSION_1, { points: 999 }),
    ]);
    expect(again.status).toBe(204);
    expect(sessionRows).toHaveLength(1);
    expect(sessionRows[0].points).toBe(30);
  });

  it("a Quiz Session id already taken by another Player is left alone", async () => {
    await push(tokenB, "/app/me/quiz-sessions", [pushedSession(SESSION_1, { points: 55 })]);

    const response = await push(tokenA, "/app/me/quiz-sessions", [
      pushedSession(SESSION_1, { points: 999 }),
    ]);
    expect(response.status).toBe(204);
    expect(sessionRows).toEqual([sessionRow(SESSION_1, PLAYER_B, { points: 55 })]);
  });

  it("POST /app/me/stat-baselines stores the batch under the JWT sub, ignoring a body owner", async () => {
    const response = await push(tokenA, "/app/me/stat-baselines", [
      pushedBaseline({ owner: PLAYER_B }),
    ]);
    expect(response.status).toBe(204);
    expect(baselineRows).toEqual([baselineRow(PLAYER_A)]);
  });

  it("POST /app/me/stat-baselines is insert-if-absent per (owner, device, themeId)", async () => {
    await push(tokenA, "/app/me/stat-baselines", [pushedBaseline()]);
    const again = await push(tokenA, "/app/me/stat-baselines", [
      pushedBaseline({ totalPoints: 999 }),
      pushedBaseline({ device: DEVICE_B, totalPoints: 60 }),
    ]);
    expect(again.status).toBe(204);
    expect(baselineRows).toEqual([
      baselineRow(PLAYER_A),
      baselineRow(PLAYER_A, { device: DEVICE_B, total_points: 60 }),
    ]);
    expect(upserts.at(-1)).toEqual({
      table: "stat_baselines",
      onConflict: "owner,device,theme_id",
      ignoreDuplicates: true,
    });
  });

  it.each([
    ["/app/me/quiz-sessions", [pushedSession(SESSION_1)]],
    ["/app/me/stat-baselines", [pushedBaseline()]],
  ])("POST %s with a deleted owner → 410 ACCOUNT_GONE", async (path, body) => {
    liveOwners.delete(PLAYER_A);

    const response = await push(tokenA, path, body);
    expect(response.status).toBe(410);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("ACCOUNT_GONE");
  });

  it("POST /app/me/quiz-sessions accepts a full batch at the cap", async () => {
    const full = Array.from({ length: MAX_PUSH_BATCH }, (_, index) =>
      pushedSession(batchSessionId(index)),
    );

    const response = await push(tokenA, "/app/me/quiz-sessions", full);
    expect(response.status).toBe(204);
    expect(sessionRows).toHaveLength(MAX_PUSH_BATCH);
  });

  it.each([
    ["/app/me/quiz-sessions", (index: number) => pushedSession(batchSessionId(index))],
    ["/app/me/stat-baselines", (_index: number) => pushedBaseline()],
  ])("POST %s with one row over the cap → 400 VALIDATION_FAILED", async (path, row) => {
    const oversized = Array.from({ length: MAX_PUSH_BATCH + 1 }, (_, index) => row(index));

    const response = await push(tokenA, path, oversized);
    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("VALIDATION_FAILED");
    expect(upserts).toEqual([]);
  });

  it.each(["/app/me/quiz-sessions", "/app/me/stat-baselines"])(
    "POST %s with an empty batch → 204 without touching the database",
    async (path) => {
      const response = await push(tokenA, path, []);
      expect(response.status).toBe(204);
      expect(upserts).toEqual([]);
    },
  );

  it("DELETE /app/me/account cascades both player tables and makes later pushes 410", async () => {
    sessionRows.push(sessionRow(SESSION_1, PLAYER_A), sessionRow(SESSION_2, PLAYER_B));
    baselineRows.push(baselineRow(PLAYER_A), baselineRow(PLAYER_B));

    const response = await authed(tokenA, "/app/me/account", { method: "DELETE" });
    expect(response.status).toBe(204);
    expect(sessionRows).toEqual([sessionRow(SESSION_2, PLAYER_B)]);
    expect(baselineRows).toEqual([baselineRow(PLAYER_B)]);

    const stranded = await push(tokenA, "/app/me/quiz-sessions", [pushedSession(SESSION_3)]);
    expect(stranded.status).toBe(410);
    expect(errorResponseSchema.parse(await stranded.json()).code).toBe("ACCOUNT_GONE");
  });
});
