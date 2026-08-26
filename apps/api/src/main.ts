import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { ENV, type Env } from "./_config/env.config";
import { AppModule } from "./app.module";
import { httpLogger } from "./common/http-logger.middleware";

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const env = app.get<Env>(ENV);

  // First in the chain so even a body-parser rejection gets its line.
  app.use(httpLogger());

  // Browser security headers; native and server callers ignore them.
  app.use(helmet());

  // Browser origins only (future Expo web); native and server callers send no Origin.
  app.enableCors({ origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : false });

  // Railway adds two hops, and counting X-Forwarded-For from the right keeps the key unforgeable.
  app.set("trust proxy", 2);

  // Sized against the capped push batches, replacing Express's unchosen 100 kb default.
  app.useBodyParser("json", { limit: "200mb" });

  // Railway SIGTERM: drain in-flight work and close the DB before the container dies.
  app.enableShutdownHooks();

  // Railway injects PORT and requires binding 0.0.0.0.
  await app.listen(app.get<Env>(ENV).PORT, "0.0.0.0");
};

void bootstrap();
