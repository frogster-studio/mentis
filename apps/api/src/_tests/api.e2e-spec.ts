import { errorResponseSchema } from "@mentis/contracts/shared";
import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { ENV } from "../_config/env.config";
import { AppModule } from "../app.module";
import { configureApp, JSON_BODY_LIMIT, NEST_OPTIONS } from "../bootstrap";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { stubDataSource, testEnv } from "./test-env";

const probeQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1) });
type ProbeQuery = z.infer<typeof probeQuerySchema>;

// A test-only route proves pipe -> filter over real HTTP without leaning on any feature's routes.
@Controller("probe")
class ProbeController {
  @Get()
  probe(@Query(new ZodValidationPipe(probeQuerySchema)) query: ProbeQuery): ProbeQuery {
    return query;
  }

  @Post()
  echo(@Body() body: unknown): unknown {
    return body;
  }
}

const oversizeBody = JSON.stringify({
  filler: "x".repeat(Number.parseInt(JSON_BODY_LIMIT) * 1024),
});

describe("api spine e2e", () => {
  let app: NestExpressApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProbeController],
    })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(getDataSourceToken())
      .useValue(stubDataSource)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>(NEST_OPTIONS);
    configureApp(app);
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

  it("POST /probe with a body over the json cap → 413 PAYLOAD_TOO_LARGE envelope", async () => {
    const response = await fetch(`${baseUrl}/probe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: oversizeBody,
    });
    expect(response.status).toBe(413);
    const body = errorResponseSchema.parse(await response.json());
    expect(body.code).toBe("PAYLOAD_TOO_LARGE");
  });
});
