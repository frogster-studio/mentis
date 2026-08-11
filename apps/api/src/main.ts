import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { configureApp, NEST_OPTIONS } from "./bootstrap";
import { ENV, type Env } from "./env";
import { RootModule } from "./root.module";

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestExpressApplication>(RootModule, NEST_OPTIONS);

  configureApp(app);
  app.enableShutdownHooks();

  // Railway injects PORT and requires binding 0.0.0.0.
  await app.listen(app.get<Env>(ENV).PORT, "0.0.0.0");
};

void bootstrap();
