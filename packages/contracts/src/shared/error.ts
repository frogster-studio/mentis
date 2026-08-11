import { z } from "zod";

// FORBIDDEN joins the union when the editor tier arrives with the auth guards.
export const errorCodeSchema = z.enum([
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "NOT_FOUND",
  "THEME_NOT_FOUND",
  "ACCOUNT_GONE",
  "RATE_LIMITED",
  "INTERNAL",
]);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
  code: errorCodeSchema,
  details: z.unknown().optional(),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
