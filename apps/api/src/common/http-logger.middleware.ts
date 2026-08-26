import { Logger } from "@nestjs/common";
import type { RequestHandler } from "express";

const logger = new Logger("HTTP");

// The status code classifies the log level - color.
const levelOf = (status: number): "log" | "warn" | "error" =>
  status >= 500 ? "error" : status >= 400 ? "warn" : "log";

export const httpLogger = (): RequestHandler => (request, response, next) => {
  const startedAt = performance.now();

  // The ErrorResponse envelope only exists as the body the filter writes, so keep hold of it.
  let body: unknown;
  const json = response.json.bind(response);
  response.json = (payload) => {
    // The status is already set here, so a 2xx payload is never retained past its own serialisation.
    if (response.statusCode >= 400) body = payload;
    return json(payload);
  };

  // Bun never fires "close" on the response, so the request is the hook that spots an abort on both runtimes.
  request.on("close", () => {
    const aborted = !response.writableFinished;
    const level = aborted ? "log" : levelOf(response.statusCode);
    const outcome = aborted ? "ABORTED" : `${response.statusCode}`;
    const elapsed = Math.round(performance.now() - startedAt);
    logger[level](`${request.method.padEnd(6)} ${request.originalUrl} ${outcome} ${elapsed}ms`);
    if (level !== "log" && body !== undefined) {
      logger[level](JSON.stringify(body, null, 2));
    }
  });

  next();
};
