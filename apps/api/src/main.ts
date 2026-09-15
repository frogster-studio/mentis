import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ENV, type Env } from "./_config/env.config";
import { AppModule } from "./app.module";
import { configureApp, NEST_OPTIONS } from "./bootstrap";

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, NEST_OPTIONS);

  configureApp(app);

  // Railway SIGTERM: drain in-flight work and close the DB before the container dies.
  app.enableShutdownHooks();

  // Railway injects PORT and requires binding 0.0.0.0.
  await app.listen(app.get<Env>(ENV).PORT, "0.0.0.0");
};

void bootstrap();
