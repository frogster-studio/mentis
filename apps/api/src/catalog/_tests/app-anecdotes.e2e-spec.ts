import { appAnecdoteDrawResponseSchema } from "@mentis/contracts/app";
import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ENV } from "../../_config/env.config";
import { AnecdoteEntity } from "../../_database/entities/anecdote.entity";
import { stubDataSource, testEnv } from "../../_tests/test-env";
import { AppModule } from "../../app.module";
import { DRAW_TIER } from "../../common/rate-limit.guard";
import { AnecdoteRepository } from "../repositories/anecdote.repository";
import { ANECDOTE_IMAGES_BUCKET } from "../utils/anecdote-image-url";

const anecdote = (index: number) =>
  Object.assign(new AnecdoteEntity(), {
    id: `40000000-0000-4000-8000-00000000000${index}`,
    text: `Anecdote **${index}**`,
    image: index === 1 ? `40000000-0000-4000-8000-000000000001/upload-1.webp` : null,
    createdAt: new Date("2026-10-01T08:00:00Z"),
    updatedAt: new Date("2026-10-01T08:00:00Z"),
  });

const fullTable = [1, 2, 3, 4].map(anecdote);

const asServed = ({ id, text, image }: AnecdoteEntity) => ({
  id,
  text,
  imageUrl:
    image === null
      ? null
      : `${testEnv.SUPABASE_URL}/storage/v1/object/public/${ANECDOTE_IMAGES_BUCKET}/${image}`,
});

let storedAnecdotes: AnecdoteEntity[] = fullTable;
let draws: number[] = [];

// Stands in for Postgres at the repository seam: the SQL itself is proven by the live smoke.
const fakeAnecdoteRepository = {
  async drawRandomAnecdotes(count) {
    draws.push(count);
    return storedAnecdotes.slice(0, count);
  },
} satisfies Pick<AnecdoteRepository, "drawRandomAnecdotes">;

async function startApp(): Promise<{ app: INestApplication; baseUrl: string }> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ENV)
    .useValue(testEnv)
    .overrideProvider(getDataSourceToken())
    .useValue(stubDataSource)
    .overrideProvider(AnecdoteRepository)
    .useValue(fakeAnecdoteRepository)
    .compile();
  const app = moduleRef.createNestApplication();
  await app.listen(0);
  return { app, baseUrl: await app.getUrl() };
}

describe("app anecdotes route e2e", () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    ({ app, baseUrl } = await startApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    storedAnecdotes = fullTable;
    draws = [];
  });

  it("GET /app/anecdotes, signed-out and without n, draws 3 and serves id, text and imageUrl", async () => {
    const response = await fetch(`${baseUrl}/app/anecdotes`);
    expect(response.status).toBe(200);
    expect(draws).toEqual([3]);
    const body = await response.json();
    expect(body).toEqual(fullTable.slice(0, 3).map(asServed));
    expect(body[0].imageUrl).toMatch(/^https?:\/\/.+\/anecdote-images\/.+\.webp$/);
    expect(body[1].imageUrl).toBeNull();
    expect(body[0]).not.toHaveProperty("createdAt");
    expect(appAnecdoteDrawResponseSchema.parse(body)).toEqual(body);
  });

  it("GET /app/anecdotes?n=50 serves the fewer rows the table holds", async () => {
    const response = await fetch(`${baseUrl}/app/anecdotes?n=50`);
    expect(response.status).toBe(200);
    expect(draws).toEqual([50]);
    expect(await response.json()).toEqual(fullTable.map(asServed));
  });

  it("GET /app/anecdotes on an empty table → 200 []", async () => {
    storedAnecdotes = [];
    const response = await fetch(`${baseUrl}/app/anecdotes`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it.each(["0", "51"])("GET /app/anecdotes?n=%s → 400 VALIDATION_FAILED", async (n) => {
    const response = await fetch(`${baseUrl}/app/anecdotes?n=${n}`);
    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("VALIDATION_FAILED");
    expect(draws).toEqual([]);
  });
});

describe("app anecdotes route throttling e2e", () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    ({ app, baseUrl } = await startApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /app/anecdotes past the Draw tier's allowance from one IP → 429 RATE_LIMITED", async () => {
    for (let request = 0; request < DRAW_TIER.limit; request++) {
      expect((await fetch(`${baseUrl}/app/anecdotes`)).status).toBe(200);
    }
    const response = await fetch(`${baseUrl}/app/anecdotes`);
    expect(response.status).toBe(429);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("RATE_LIMITED");
  });
});
