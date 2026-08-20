import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ENV } from "../../_config/env.config";
import { stubDataSource, testEnv } from "../../_tests/test-env";
import { AppModule } from "../../app.module";
import { CatalogRepository, type DrawnQuestion } from "../repositories/catalog.repository";

const themes = [
  { id: "les-simpson", name: "Les Simpson", questionCount: 2 },
  { id: "marie-antoinette", name: "Marie-Antoinette", questionCount: 1 },
];

const question = (id: string, themeId: string, themeName: string): DrawnQuestion => ({
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

type Draw = { themeId: string | null; count: number };

let draws: Draw[] = [];

// Stands in for Postgres at the repository seam: the SQL itself is proven by the live smoke.
const fakeCatalogRepository = {
  async themesWithQuestionCounts() {
    return themes;
  },
  async themeExists(id) {
    return themes.some((theme) => theme.id === id);
  },
  async drawRandomQuestions(themeId, count) {
    draws.push({ themeId, count });
    return questions.filter((row) => themeId === null || row.themeId === themeId).slice(0, count);
  },
  async questionsByIds(ids) {
    return questions.filter((row) => ids.includes(row.id));
  },
} satisfies Pick<
  CatalogRepository,
  "themesWithQuestionCounts" | "themeExists" | "drawRandomQuestions" | "questionsByIds"
>;

describe("app content routes e2e", () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(getDataSourceToken())
      .useValue(stubDataSource)
      .overrideProvider(CatalogRepository)
      .useValue(fakeCatalogRepository)
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    draws = [];
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
    expect(draws).toEqual([{ themeId: null, count: 10 }]);
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
    expect(draws).toEqual([{ themeId: "les-simpson", count: 2 }]);
    const body = await response.json();
    expect(body.map((row: { id: string }) => row.id)).toEqual(["q1", "q2"]);
  });

  it("GET /app/questions with an unknown theme → 404 THEME_NOT_FOUND, before drawing", async () => {
    const response = await fetch(`${baseUrl}/app/questions?theme=nope`);
    expect(response.status).toBe(404);
    const body = errorResponseSchema.parse(await response.json());
    expect(body.code).toBe("THEME_NOT_FOUND");
    expect(draws).toEqual([]);
  });

  it.each(["0", "51", "1.5", "many"])(
    "GET /app/questions?n=%s → 400 VALIDATION_FAILED",
    async (n) => {
      const response = await fetch(`${baseUrl}/app/questions?n=${n}`);
      expect(response.status).toBe(400);
      const body = errorResponseSchema.parse(await response.json());
      expect(body.code).toBe("VALIDATION_FAILED");
      expect(draws).toEqual([]);
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
