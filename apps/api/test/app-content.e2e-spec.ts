import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { stubDataSource, testEnv } from "../src/_tests/test-env";
import { ENV } from "../src/env";
import { RootModule } from "../src/root.module";
import { SUPABASE } from "../src/supabase";

const themes = [
  { id: "les-simpson", name: "Les Simpson", questionCount: 2 },
  { id: "marie-antoinette", name: "Marie-Antoinette", questionCount: 1 },
];

const question = (id: string, themeId: string, themeName: string) => ({
  id,
  themeId,
  themeName,
  text: `${id} ?`,
  answer: "42",
  aliases: [],
  misspellings: [],
  wrongChoices: ["1", "2", "3"],
});

const questions = [
  question("q1", "les-simpson", "Les Simpson"),
  question("q2", "les-simpson", "Les Simpson"),
  question("q3", "marie-antoinette", "Marie-Antoinette"),
];

type DrawArgs = { theme_slug: string | null; n: number };

let drawArgs: DrawArgs[] = [];

const themeRows = () =>
  themes.map(({ id, name, questionCount }) => ({
    id,
    name,
    questions: [{ count: questionCount }],
  }));

// Stands in for PostgREST: the aliased select strings are proven by the live smoke, not here.
const stubSupabase = {
  from: (table: string) => {
    if (table !== "themes") {
      throw new Error(`unexpected table ${table}`);
    }
    return {
      select: () =>
        Object.assign(Promise.resolve({ data: themeRows(), error: null }), {
          eq: (_column: string, value: string) => ({
            maybeSingle: () =>
              Promise.resolve({
                data: themes.find((theme) => theme.id === value) ?? null,
                error: null,
              }),
          }),
        }),
    };
  },
  rpc: (fn: string, args: DrawArgs) => {
    if (fn !== "get_random_questions") {
      throw new Error(`unexpected function ${fn}`);
    }
    drawArgs.push(args);
    const drawn = questions
      .filter((row) => args.theme_slug === null || row.themeId === args.theme_slug)
      .slice(0, args.n);
    return { select: () => Promise.resolve({ data: drawn, error: null }) };
  },
};

describe("app content routes e2e", () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [RootModule] })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(getDataSourceToken())
      .useValue(stubDataSource)
      .overrideProvider(SUPABASE)
      .useValue(stubSupabase)
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    drawArgs = [];
  });

  it("GET /app/themes returns camelCase Themes with their Question count", async () => {
    const response = await fetch(`${baseUrl}/app/themes`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { id: "les-simpson", name: "Les Simpson", questionCount: 2 },
      { id: "marie-antoinette", name: "Marie-Antoinette", questionCount: 1 },
    ]);
  });

  it("GET /app/questions draws 10 across every Theme by default", async () => {
    const response = await fetch(`${baseUrl}/app/questions`);
    expect(response.status).toBe(200);
    expect(drawArgs).toEqual([{ theme_slug: null, n: 10 }]);
    const body = await response.json();
    expect(body).toHaveLength(3);
    expect(body[0]).toMatchObject({ id: "q1", themeId: "les-simpson", themeName: "Les Simpson" });
    expect(new Set(body.map((row: { themeId: string }) => row.themeId))).toEqual(
      new Set(["les-simpson", "marie-antoinette"]),
    );
  });

  it("GET /app/questions?theme= draws from that Theme only", async () => {
    const response = await fetch(`${baseUrl}/app/questions?theme=les-simpson&n=2`);
    expect(response.status).toBe(200);
    expect(drawArgs).toEqual([{ theme_slug: "les-simpson", n: 2 }]);
    const body = await response.json();
    expect(body.map((row: { id: string }) => row.id)).toEqual(["q1", "q2"]);
  });

  it("GET /app/questions with an unknown theme → 404 THEME_NOT_FOUND, before drawing", async () => {
    const response = await fetch(`${baseUrl}/app/questions?theme=nope`);
    expect(response.status).toBe(404);
    const body = errorResponseSchema.parse(await response.json());
    expect(body.code).toBe("THEME_NOT_FOUND");
    expect(drawArgs).toEqual([]);
  });

  it.each(["0", "51", "1.5", "many"])(
    "GET /app/questions?n=%s → 400 VALIDATION_FAILED",
    async (n) => {
      const response = await fetch(`${baseUrl}/app/questions?n=${n}`);
      expect(response.status).toBe(400);
      const body = errorResponseSchema.parse(await response.json());
      expect(body.code).toBe("VALIDATION_FAILED");
      expect(drawArgs).toEqual([]);
    },
  );

  it.each(["/app/themes", "/app/questions?theme=les-simpson"])(
    "GET %s answers identically signed-in and signed-out",
    async (path) => {
      const anonymous = await fetch(`${baseUrl}${path}`);
      const bearing = await fetch(`${baseUrl}${path}`, {
        headers: { Authorization: "Bearer not-a-real-token" },
      });
      expect(bearing.status).toBe(anonymous.status);
      expect(await bearing.json()).toEqual(await anonymous.json());
    },
  );
});
