import { MAX_PUSH_BATCH } from "@mentis/contracts/app";
import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from "jose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ENV } from "../../_config/env.config";
import { SUPABASE } from "../../_config/supabase.config";
import { PlayerProfileEntity } from "../../_database/entities/player-profile.entity";
import { QuizSessionEntity } from "../../_database/entities/quiz-session.entity";
import { StatBaselineEntity } from "../../_database/entities/stat-baseline.entity";
import { stubDataSource, testEnv } from "../../_tests/test-env";
import { AppModule } from "../../app.module";
import { JWKS } from "../../auth/jwks";
import { AccountGoneError, PlayerRepository } from "../repositories/player.repository";
import { ProfileRepository } from "../repositories/profile.repository";
import { DIGIT_DRAW } from "../utils/digit-draw";

const PLAYER_A = "11111111-1111-4111-8111-111111111111";
const PLAYER_B = "22222222-2222-4222-8222-222222222222";
const DEVICE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DEVICE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SESSION_1 = "10000000-0000-4000-8000-000000000001";
const SESSION_2 = "10000000-0000-4000-8000-000000000002";
const SESSION_3 = "10000000-0000-4000-8000-000000000003";

let sessionRows: QuizSessionEntity[] = [];
let baselineRows: StatBaselineEntity[] = [];
let profileRows: PlayerProfileEntity[] = [];
let liveOwners = new Set<string>();
let inserts: string[] = [];
let draws: number[] = [];

const sessionRow = (
  id: string,
  owner: string,
  overrides: Partial<QuizSessionEntity> = {},
): QuizSessionEntity =>
  Object.assign(new QuizSessionEntity(), {
    id,
    owner,
    themeId: "geo",
    themeName: "Géographie",
    points: 30,
    finishedAt: new Date("2026-08-11T10:00:00.000Z"),
    ...overrides,
  });

const baselineRow = (
  owner: string,
  overrides: Partial<StatBaselineEntity> = {},
): StatBaselineEntity =>
  Object.assign(new StatBaselineEntity(), {
    owner,
    device: DEVICE_A,
    themeId: "geo",
    themeName: "Géographie",
    totalPoints: 120,
    sessionCount: 4,
    ...overrides,
  });

const profileRow = (owner: string, pseudo: string): PlayerProfileEntity =>
  Object.assign(new PlayerProfileEntity(), { owner, pseudo, pseudoKey: pseudo.toLowerCase() });

// ON CONFLICT DO NOTHING and the owner FK, in memory: the SQL itself is proven by the live smoke.
const insertIfAbsent = <Row extends { owner: string }>(
  table: string,
  stored: Row[],
  rows: Row[],
  clashes: (existing: Row, row: Row) => boolean,
): void => {
  inserts.push(table);
  if (rows.some((row) => !liveOwners.has(row.owner))) {
    throw new AccountGoneError();
  }
  for (const row of rows) {
    if (!stored.some((existing) => clashes(existing, row))) {
      stored.push(row);
    }
  }
};

const fakePlayerRepository = {
  async findQuizSessions(owner) {
    return sessionRows
      .filter((row) => row.owner === owner)
      .sort((left, right) => left.finishedAt.getTime() - right.finishedAt.getTime());
  },
  async findStatBaselines(owner) {
    return baselineRows.filter((row) => row.owner === owner);
  },
  async insertQuizSessionsIfAbsent(rows) {
    insertIfAbsent(
      "quiz_sessions",
      sessionRows,
      rows.map((row) => Object.assign(new QuizSessionEntity(), row)),
      (existing, row) => existing.id === row.id,
    );
  },
  async insertStatBaselinesIfAbsent(rows) {
    insertIfAbsent(
      "stat_baselines",
      baselineRows,
      rows.map((row) => Object.assign(new StatBaselineEntity(), row)),
      (existing, row) =>
        existing.owner === row.owner &&
        existing.device === row.device &&
        existing.themeId === row.themeId,
    );
  },
} satisfies Pick<
  PlayerRepository,
  | "findQuizSessions"
  | "findStatBaselines"
  | "insertQuizSessionsIfAbsent"
  | "insertStatBaselinesIfAbsent"
>;

const fakeProfileRepository = {
  async findByOwner(owner) {
    return profileRows.find((row) => row.owner === owner) ?? null;
  },
  async findByPseudoKey(pseudoKey) {
    return profileRows.find((row) => row.pseudoKey === pseudoKey) ?? null;
  },
  async insertIfAbsent(profile) {
    inserts.push("player_profiles");
    const clashes = profileRows.some(
      (row) => row.owner === profile.owner || row.pseudoKey === profile.pseudoKey,
    );
    if (!clashes) {
      profileRows.push(Object.assign(new PlayerProfileEntity(), profile));
    }
  },
  async updateByOwner(owner, profile) {
    const row = profileRows.find((existing) => existing.owner === owner);
    if (row !== undefined) {
      Object.assign(row, profile);
    }
  },
} satisfies Pick<
  ProfileRepository,
  "findByOwner" | "findByPseudoKey" | "insertIfAbsent" | "updateByOwner"
>;

const stubSupabase = {
  auth: {
    admin: {
      // The owner FK cascade, in memory.
      deleteUser: (id: string) => {
        liveOwners.delete(id);
        sessionRows = sessionRows.filter((row) => row.owner !== id);
        baselineRows = baselineRows.filter((row) => row.owner !== id);
        profileRows = profileRows.filter((row) => row.owner !== id);
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

  const put = (token: string, path: string, body: unknown) =>
    authed(token, path, { method: "PUT", body: JSON.stringify(body) });

  beforeAll(async () => {
    const signingKey = await generateKeyPair("ES256", { extractable: true });
    const publicJwk = { ...(await exportJWK(signingKey.publicKey)), alg: "ES256", kid: "test-key" };
    const mint = (sub: string, fullName?: string): Promise<string> =>
      new SignJWT({
        iss: `${testEnv.SUPABASE_URL}/auth/v1`,
        aud: "authenticated",
        sub,
        role: "authenticated",
        ...(fullName === undefined ? {} : { user_metadata: { full_name: fullName } }),
      } satisfies JWTPayload)
        .setProtectedHeader({ alg: "ES256", kid: "test-key" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(signingKey.privateKey);
    tokenA = await mint(PLAYER_A, "Éléonore Dupont");
    tokenB = await mint(PLAYER_B);

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(getDataSourceToken())
      .useValue(stubDataSource)
      .overrideProvider(PlayerRepository)
      .useValue(fakePlayerRepository)
      .overrideProvider(ProfileRepository)
      .useValue(fakeProfileRepository)
      .overrideProvider(DIGIT_DRAW)
      .useValue(() => draws.shift() ?? 0)
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
    profileRows = [];
    liveOwners = new Set([PLAYER_A, PLAYER_B]);
    inserts = [];
    draws = [];
  });

  it.each([
    ["GET", "/app/me/profile"],
    ["PUT", "/app/me/pseudo"],
    ["GET", "/app/me/stats"],
    ["POST", "/app/me/quiz-sessions"],
    ["POST", "/app/me/stat-baselines"],
    ["DELETE", "/app/me/account"],
  ])("%s %s without a token → 401 UNAUTHENTICATED", async (method, path) => {
    const response = await fetch(`${baseUrl}${path}`, { method });
    expect(response.status).toBe(401);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
  });

  it("GET /app/me/profile derives the default pseudo from full_name and keeps it", async () => {
    draws = [48213, 70001];

    const first = await authed(tokenA, "/app/me/profile");
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ pseudo: "Eleonore48213" });

    const second = await authed(tokenA, "/app/me/profile");
    expect(await second.json()).toEqual({ pseudo: "Eleonore48213" });
    expect(profileRows).toHaveLength(1);
  });

  it("GET /app/me/profile without a full_name claim falls back to Joueur", async () => {
    draws = [55020];

    const response = await authed(tokenB, "/app/me/profile");
    expect(await response.json()).toEqual({ pseudo: "Joueur55020" });
  });

  it("GET /app/me/profile draws new digits when the default's key is taken", async () => {
    profileRows.push(profileRow(PLAYER_B, "Eleonore48213"));
    draws = [48213, 70001];

    const response = await authed(tokenA, "/app/me/profile");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ pseudo: "Eleonore70001" });
    expect(inserts).toEqual(["player_profiles", "player_profiles"]);
  });

  it("PUT /app/me/pseudo names a Player who has no profile row yet", async () => {
    const response = await put(tokenA, "/app/me/pseudo", { pseudo: "Nico_42" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ pseudo: "Nico_42" });
    expect(profileRows).toEqual([profileRow(PLAYER_A, "Nico_42")]);
  });

  it("PUT /app/me/pseudo of a key another owner holds, any casing → 409 PSEUDO_TAKEN", async () => {
    profileRows.push(profileRow(PLAYER_B, "Nico_42"));

    const response = await put(tokenA, "/app/me/pseudo", { pseudo: "NICO_42" });
    expect(response.status).toBe(409);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("PSEUDO_TAKEN");
    expect(profileRows).toEqual([profileRow(PLAYER_B, "Nico_42")]);
  });

  it("PUT /app/me/pseudo of your own pseudo in another casing stores it as typed", async () => {
    draws = [48213];
    await authed(tokenA, "/app/me/profile");

    const response = await put(tokenA, "/app/me/pseudo", { pseudo: "ELEONORE48213" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ pseudo: "ELEONORE48213" });

    const after = await authed(tokenA, "/app/me/profile");
    expect(await after.json()).toEqual({ pseudo: "ELEONORE48213" });
    expect(profileRows).toHaveLength(1);
  });

  it.each([{ pseudo: "no" }, { pseudo: "Jean-Pierre" }, {}])(
    "PUT /app/me/pseudo with %o → 400 VALIDATION_FAILED",
    async (body) => {
      const response = await put(tokenA, "/app/me/pseudo", body);
      expect(response.status).toBe(400);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("VALIDATION_FAILED");
      expect(profileRows).toEqual([]);
    },
  );

  it("GET /app/me/stats returns the owner's world, sessions finishedAt asc, owner off the wire", async () => {
    sessionRows.push(
      sessionRow(SESSION_2, PLAYER_A, {
        finishedAt: new Date("2026-08-11T12:00:00.000Z"),
        points: 20,
      }),
      sessionRow(SESSION_1, PLAYER_A, {
        finishedAt: new Date("2026-08-11T09:00:00.000Z"),
        points: 10,
      }),
      sessionRow(SESSION_3, PLAYER_A, {
        finishedAt: new Date("2026-08-11T15:00:00.000Z"),
        points: 30,
      }),
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
    expect(JSON.stringify(body)).not.toContain("finishedAt");
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
    expect(inserts).toEqual(["quiz_sessions"]);
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
      baselineRow(PLAYER_A, { device: DEVICE_B, totalPoints: 60 }),
    ]);
    expect(inserts).toEqual(["stat_baselines", "stat_baselines"]);
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
    expect(inserts).toEqual([]);
  });

  it.each(["/app/me/quiz-sessions", "/app/me/stat-baselines"])(
    "POST %s with an empty batch → 204 without touching the database",
    async (path) => {
      const response = await push(tokenA, path, []);
      expect(response.status).toBe(204);
      expect(inserts).toEqual([]);
    },
  );

  it("DELETE /app/me/account cascades the player tables and makes later pushes 410", async () => {
    sessionRows.push(sessionRow(SESSION_1, PLAYER_A), sessionRow(SESSION_2, PLAYER_B));
    baselineRows.push(baselineRow(PLAYER_A), baselineRow(PLAYER_B));
    profileRows.push(profileRow(PLAYER_A, "Eleonore48213"), profileRow(PLAYER_B, "Nico_42"));

    const response = await authed(tokenA, "/app/me/account", { method: "DELETE" });
    expect(response.status).toBe(204);
    expect(sessionRows).toEqual([sessionRow(SESSION_2, PLAYER_B)]);
    expect(baselineRows).toEqual([baselineRow(PLAYER_B)]);
    expect(profileRows).toEqual([profileRow(PLAYER_B, "Nico_42")]);

    const stranded = await push(tokenA, "/app/me/quiz-sessions", [pushedSession(SESSION_3)]);
    expect(stranded.status).toBe(410);
    expect(errorResponseSchema.parse(await stranded.json()).code).toBe("ACCOUNT_GONE");
  });
});
