import { STATUS_CODES } from "node:http";
import type { ErrorCode, ErrorResponse } from "@mentis/contracts/shared";
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  PayloadTooLargeException,
} from "@nestjs/common";
import type { Response } from "express";

// Codes set explicitly at throw sites win; these are the per-status fallbacks.
const DEFAULT_CODES: Record<number, ErrorCode> = {
  400: "VALIDATION_FAILED",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  410: "ACCOUNT_GONE",
  413: "PAYLOAD_TOO_LARGE",
  429: "RATE_LIMITED",
  500: "INTERNAL",
};

// The body parser refuses an oversize body before Nest can wrap it, and a raw throw would read as a 500.
const isPayloadTooLarge = (error: unknown): boolean =>
  error instanceof Error && "type" in error && error.type === "entity.too.large";

// Every non-2xx body is the ErrorResponse envelope, emitted here and nowhere else.
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const reportable =
      exception instanceof HttpException
        ? exception
        : isPayloadTooLarge(exception)
          ? new PayloadTooLargeException("Request body too large")
          : undefined;
    const status = reportable?.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = reportable?.getResponse();
    const fields =
      typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

    // Catching everything would otherwise swallow the only trace of a real crash.
    if (reportable === undefined) {
      this.logger.error("Unhandled exception", exception);
    }

    const message =
      typeof fields.message === "string"
        ? fields.message
        : typeof payload === "string"
          ? payload
          : "Unexpected error";

    const body: ErrorResponse = {
      statusCode: status,
      error: STATUS_CODES[status] ?? "Error",
      message,
      code: (fields.code as ErrorCode | undefined) ?? DEFAULT_CODES[status] ?? "INTERNAL",
      ...(fields.details !== undefined ? { details: fields.details } : {}),
    };
    response.status(status).json(body);
  }
}
