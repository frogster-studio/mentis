import type { IncomingMessage } from "node:http";
import type { NestApplicationOptions } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { ENV, type Env } from "./_config/env.config";
import { httpLogger } from "./common/http-logger.middleware";

// Express's own json parser must never register, or its 100 kb default would win over the cap below.
export const NEST_OPTIONS: NestApplicationOptions = { bodyParser: false };

export const JSON_BODY_LIMIT = "64kb";

export const ANECDOTE_IMAGE_BODY_LIMIT = 153_600;

const ANECDOTE_IMAGE_ROUTE = /^\/admin\/anecdotes\/[^/?]+\/image(?:\?|$)/;

const isAnecdoteImageUpload = (request: IncomingMessage): boolean =>
  request.method === "PUT" && ANECDOTE_IMAGE_ROUTE.test(request.url ?? "");

export const configureApp = (app: NestExpressApplication): void => {
  const env = app.get<Env>(ENV);

  app.use(httpLogger());

  // Browser security headers; native and server callers ignore them.
  app.use(helmet());

  // Browser origins only (future Expo web); native and server callers send no Origin.
  app.enableCors({ origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : false });

  // Railway adds two hops, and counting X-Forwarded-For from the right keeps the key unforgeable.
  app.set("trust proxy", 2);

  // The Anecdote Image route alone reads raw bytes, whatever their label: its own header decides.
  app.useBodyParser("raw", { type: isAnecdoteImageUpload, limit: ANECDOTE_IMAGE_BODY_LIMIT });

  // Sized against the capped push batches, replacing Express's unchosen 100 kb default.
  app.useBodyParser("json", { limit: JSON_BODY_LIMIT });
};
