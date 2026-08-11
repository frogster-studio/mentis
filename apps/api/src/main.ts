import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { ENV, type Env } from "./env";
import { RootModule } from "./root.module";

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestExpressApplication>(RootModule);
  const env = app.get<Env>(ENV);

  app.use(helmet());
  // Browser origins only (future Expo web); native and server callers send no Origin.
  app.enableCors({ origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : false });
  app.enableShutdownHooks();

  // Railway injects PORT and requires binding 0.0.0.0.
  await app.listen(env.PORT, "0.0.0.0");
};

void bootstrap();
