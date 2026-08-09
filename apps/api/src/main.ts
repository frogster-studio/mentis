import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { corsOrigins, ENV, type Env } from "./env";
import { RootModule } from "./root.module";

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestExpressApplication>(RootModule);
  const env = app.get<Env>(ENV);

  // Behind Railway's edge proxy the throttler must see real client IPs.
  app.set("trust proxy", 1);
  app.use(helmet());
  const origins = corsOrigins(env);
  // Browser origins only (future Expo web); BFF and native traffic send no Origin.
  app.enableCors({ origin: origins.length > 0 ? origins : false });
  app.enableShutdownHooks();

  // Railway injects PORT and requires binding 0.0.0.0.
  await app.listen(env.PORT, "0.0.0.0");
};

void bootstrap();
