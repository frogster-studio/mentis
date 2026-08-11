import type { NestApplicationOptions } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { ENV, type Env } from "./env";

// Express's own json parser must never register, or its 100 kb default would win over the cap below.
export const NEST_OPTIONS: NestApplicationOptions = { bodyParser: false };

export const configureApp = (app: NestExpressApplication): void => {
  const env = app.get<Env>(ENV);

  app.use(helmet());
  // Browser origins only (future Expo web); native and server callers send no Origin.
  app.enableCors({ origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : false });
  // Railway fronts the container with two hops, so the client sits two from the right of
  // X-Forwarded-For; trusting one hop reads the edge itself and every caller shares its buckets.
  // Counting from the right also keeps the key unforgeable — a client-sent header is pushed left.
  app.set("trust proxy", 2);
  // Sized against the capped push batches, replacing Express's unchosen 100 kb default.
  app.useBodyParser("json", { limit: "64kb" });
};
