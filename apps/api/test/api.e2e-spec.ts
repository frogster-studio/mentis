import { errorResponseSchema } from "@mentis/contracts/shared";
import { Controller, Get, type INestApplication, Query } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { ZodValidationPipe } from "../src/common/zod-validation.pipe";
import { ENV, type Env } from "../src/env";
import { RootModule } from "../src/root.module";

const probeQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1) });
type ProbeQuery = z.infer<typeof probeQuerySchema>;

// No business routes exist yet, so proving pipe -> filter over real HTTP needs a test-only route.
@Controller("probe")
class ProbeController {
  @Get()
  probe(@Query(new ZodValidationPipe(probeQuerySchema)) query: ProbeQuery): ProbeQuery {
    return query;
  }
}

const testEnv: Env = {
  PORT: 0,
  SUPABASE_URL: "https://stub.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_stub",
  CORS_ORIGINS: [],
};

describe("api spine e2e", () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RootModule],
      controllers: [ProbeController],
    })
      .overrideProvider(ENV)
      .useValue(testEnv)
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

  it("GET an unknown route → 404 NOT_FOUND envelope", async () => {
    const response = await fetch(`${baseUrl}/does-not-exist`);
    expect(response.status).toBe(404);
    const body = errorResponseSchema.parse(await response.json());
    expect(body.code).toBe("NOT_FOUND");
    expect(body.error).toBe("Not Found");
  });

  it("GET /probe applies the schema defaults", async () => {
    const response = await fetch(`${baseUrl}/probe`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ page: 1 });
  });

  it("GET /probe?page=0 → 400 VALIDATION_FAILED envelope with details", async () => {
    const response = await fetch(`${baseUrl}/probe?page=0`);
    expect(response.status).toBe(400);
    const body = errorResponseSchema.parse(await response.json());
    expect(body.statusCode).toBe(400);
    expect(body.error).toBe("Bad Request");
    expect(body.code).toBe("VALIDATION_FAILED");
    expect(body.details).toBeDefined();
  });
});
