import type { ErrorCode, ErrorResponse } from "@mentis/contracts/shared";
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

const REASONS: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  410: "Gone",
  429: "Too Many Requests",
  500: "Internal Server Error",
};

// Codes set explicitly at throw sites win; these are the per-status fallbacks.
const DEFAULT_CODES: Record<number, ErrorCode> = {
  400: "VALIDATION_FAILED",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  410: "ACCOUNT_GONE",
  429: "RATE_LIMITED",
  500: "INTERNAL",
};

// Every non-2xx body is the ErrorResponse envelope (#6), emitted here and
// nowhere else.
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = isHttp ? exception.getResponse() : undefined;
    const fields =
      typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

    const message =
      typeof fields.message === "string"
        ? fields.message
        : typeof payload === "string"
          ? payload
          : "Unexpected error";

    const body: ErrorResponse = {
      statusCode: status,
      error: REASONS[status] ?? "Error",
      message,
      code: (fields.code as ErrorCode | undefined) ?? DEFAULT_CODES[status] ?? "INTERNAL",
      ...(fields.details !== undefined ? { details: fields.details } : {}),
    };
    response.status(status).json(body);
  }
}
