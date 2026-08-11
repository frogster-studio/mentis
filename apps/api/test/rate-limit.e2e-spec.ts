import { MAX_PUSH_BATCH } from "@mentis/contracts/app";
import { errorResponseSchema } from "@mentis/contracts/shared";
import { Controller, Get, UseGuards } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { SkipThrottle } from "@nestjs/throttler";
import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from "jose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { JWKS } from "../src/auth/jwks";
import { configureApp, NEST_OPTIONS } from "../src/bootstrap";
import {
  AUTHENTICATED_TIER,
  DRAW_TIER,
  DrawThrottlerGuard,
  EVERY_TIER,
  PUBLIC_TIER,
} from "../src/common/rate-limit.guard";
import { ENV } from "../src/env";
import { RootModule } from "../src/root.module";
import { SUPABASE } from "../src/supabase";
import { testEnv } from "./test-env";

const EMPTY = { data: [], count: 0, error: null };

// Every route answers empty here: this suite is about the guards in front of them, not their reads.
const emptyBuilder = (): Promise<typeof EMPTY> =>
  Object.assign(Promise.resolve(EMPTY), {
    eq: () => emptyBuilder(),
    order: () => emptyBuilder(),
    range: () => Promise.resolve(EMPTY),
  });

const stubSupabase = {
  from: () => ({
    select: () => emptyBuilder(),
    upsert: () => Promise.resolve({ data: null, error: null }),
  }),
  rpc: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
};

const pushedSession = (index: number) => ({
  id: `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  themeId: "les-simpson",
  themeName: "Les Simpson",
  points: 30,
  finishedAt: "2026-08-11T10:00:00.000Z",
});

const pushedBaseline = (index: number) => ({
  device: `20000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  themeId: "les-simpson",
  themeName: "Les Simpson",
  totalPoints: 120,
  sessionCount: 4,
});

// /health proves the structural exemption; only a throttled route proves the decorator itself.
@Controller("skip-probe")
@UseGuards(DrawThrottlerGuard)
@SkipThrottle(EVERY_TIER)
class SkipProbeController {
  @Get()
  probe(): { status: "ok" } {
    return { status: "ok" };
  }
}

describe("rate limiting e2e", () => {
  let app: NestExpressApplication;
  let baseUrl: string;
  let mint: (sub: string, editor?: boolean) => Promise<string>;

  // The tiers are stateful for a whole minute, so every test gets a caller of its own.
  const from = (ip: string, path: string, init: RequestInit = {}) =>
    fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { "X-Forwarded-For": ip, ...init.headers },
    });

  const authed = (token: string, path: string, init: RequestInit = {}) =>
    fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
    });

  // Walks a tier to its limit, leaving the next call as the one that must trip.
  const exhaust = async (times: number, call: () => Promise<Response>): Promise<Set<number>> => {
    const statuses = new Set<number>();
    for (let index = 0; index < times; index += 1) {
      const response = await call();
      await response.arrayBuffer();
      statuses.add(response.status);
    }
    return statuses;
  };

  const expectRateLimited = async (response: Response): Promise<void> => {
    expect(response.status).toBe(429);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("RATE_LIMITED");
  };

  beforeAll(async () => {
    const signingKey = await generateKeyPair("ES256", { extractable: true });
    const publicJwk = { ...(await exportJWK(signingKey.publicKey)), alg: "ES256", kid: "test-key" };
    mint = (sub, editor = false) =>
      new SignJWT({
        iss: `${testEnv.SUPABASE_URL}/auth/v1`,
        aud: "authenticated",
        sub,
        role: "authenticated",
        ...(editor ? { app_metadata: { role: "editor" } } : {}),
      } satisfies JWTPayload)
        .setProtectedHeader({ alg: "ES256", kid: "test-key" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(signingKey.privateKey);

    const moduleRef = await Test.createTestingModule({
      imports: [RootModule],
      controllers: [SkipProbeController],
    })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(SUPABASE)
      .useValue(stubSupabase)
      .overrideProvider(JWKS)
      .useValue(createLocalJWKSet({ keys: [publicJwk] }))
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>(NEST_OPTIONS);
    configureApp(app);
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /app/themes serves the whole public allowance, then rate-limits the caller", async () => {
    const ip = "203.0.113.1";

    expect(await exhaust(PUBLIC_TIER.limit, () => from(ip, "/app/themes"))).toEqual(new Set([200]));
    await expectRateLimited(await from(ip, "/app/themes"));
  });

  it("GET /app/questions has a tighter allowance of its own", async () => {
    const ip = "203.0.113.2";

    expect(await exhaust(DRAW_TIER.limit, () => from(ip, "/app/questions"))).toEqual(
      new Set([200]),
    );
    await expectRateLimited(await from(ip, "/app/questions"));
    // The draw is spent, but its bucket is not the public one.
    expect((await from(ip, "/app/themes")).status).toBe(200);
  });

  it("a second IP keeps its own bucket behind the same proxy", async () => {
    const spent = "203.0.113.3";
    await exhaust(DRAW_TIER.limit, () => from(spent, "/app/questions"));
    await expectRateLimited(await from(spent, "/app/questions"));

    expect((await from("203.0.113.4", "/app/questions")).status).toBe(200);
  });

  // Railway appends its own edge to X-Forwarded-For, and that edge rotates between addresses.
  // A one-hop trust setting buckets on the edge, so callers share it and one client can spend
  // everyone's allowance. Single-entry headers read the same under either setting — only a real
  // two-hop chain tells them apart.
  it("keys on the client through the proxy chain, not on the rotating edge", async () => {
    const client = "203.0.113.7";
    const viaEdge = (edge: string) =>
      fetch(`${baseUrl}/app/questions`, { headers: { "X-Forwarded-For": `${client}, ${edge}` } });

    await exhaust(DRAW_TIER.limit, () => viaEdge("79.127.178.81"));
    // A different edge for the same client must not hand it a second allowance.
    await expectRateLimited(await viaEdge("79.127.178.82"));
    // And one spent client must not lock out the others sharing that edge.
    expect((await from("203.0.113.8, 79.127.178.81", "/app/questions")).status).toBe(200);
  });

  it("the authenticated allowance is one bucket per sub across both surfaces", async () => {
    const editor = await mint("33333333-3333-4333-8333-333333333333", true);
    const half = AUTHENTICATED_TIER.limit / 2;

    expect(await exhaust(half, () => authed(editor, "/app/me/stats"))).toEqual(new Set([200]));
    expect(await exhaust(half, () => authed(editor, "/admin/cards"))).toEqual(new Set([200]));
    await expectRateLimited(await authed(editor, "/app/me/stats"));
    await expectRateLimited(await authed(editor, "/admin/cards"));
  });

  it("two players behind one IP get separate buckets", async () => {
    const spent = await mint("44444444-4444-4444-8444-444444444444");
    await exhaust(AUTHENTICATED_TIER.limit, () => authed(spent, "/app/me/stats"));
    await expectRateLimited(await authed(spent, "/app/me/stats"));

    const fresh = await mint("55555555-5555-4555-8555-555555555555");
    expect((await authed(fresh, "/app/me/stats")).status).toBe(200);
  });

  it("GET /health never trips, however hard it is polled", async () => {
    const ip = "203.0.113.5";
    const beyondEveryTier = AUTHENTICATED_TIER.limit + 1;

    expect(await exhaust(beyondEveryTier, () => from(ip, "/health"))).toEqual(new Set([200]));
  });

  it("the skip decorator exempts a route even with a tier guard on it", async () => {
    const ip = "203.0.113.6";

    expect(await exhaust(DRAW_TIER.limit + 1, () => from(ip, "/skip-probe"))).toEqual(
      new Set([200]),
    );
  });

  it("a body over the 64 kb cap is refused as an envelope, not a crash", async () => {
    const token = await mint("66666666-6666-4666-8666-666666666666");
    const oversized = [{ ...pushedSession(1), themeName: "x".repeat(64 * 1024) }];

    const response = await authed(token, "/app/me/quiz-sessions", {
      method: "POST",
      body: JSON.stringify(oversized),
    });
    expect(response.status).toBe(413);
    // Its own code, not VALIDATION_FAILED: a size refusal is not a field the client can correct.
    expect(errorResponseSchema.parse(await response.json()).code).toBe("PAYLOAD_TOO_LARGE");
  });

  it.each([
    ["/app/me/quiz-sessions", pushedSession],
    ["/app/me/stat-baselines", pushedBaseline],
  ])(
    "POST %s takes a full batch under the cap, and one row more is still a 400",
    async (path, row) => {
      const token = await mint("77777777-7777-4777-8777-777777777777");
      const full = Array.from({ length: MAX_PUSH_BATCH }, (_, index) => row(index));

      const accepted = await authed(token, path, { method: "POST", body: JSON.stringify(full) });
      expect(accepted.status).toBe(204);

      const oversized = await authed(token, path, {
        method: "POST",
        body: JSON.stringify([...full, row(MAX_PUSH_BATCH)]),
      });
      expect(oversized.status).toBe(400);
      expect(errorResponseSchema.parse(await oversized.json()).code).toBe("VALIDATION_FAILED");
    },
  );
});
