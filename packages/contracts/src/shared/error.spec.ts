import { describe, expect, it } from "vitest";
import { errorResponseSchema } from "./error";

describe("errorResponseSchema", () => {
  it("accepts the envelope with a known code", () => {
    const envelope = {
      statusCode: 404,
      error: "Not Found",
      message: "unknown theme",
      code: "THEME_NOT_FOUND",
    };
    expect(errorResponseSchema.parse(envelope)).toEqual(envelope);
  });

  it("keeps details optional and untyped", () => {
    const envelope = {
      statusCode: 400,
      error: "Bad Request",
      message: "Request validation failed",
      code: "VALIDATION_FAILED",
      details: { fieldErrors: { page: ["Too small"] } },
    };
    expect(errorResponseSchema.parse(envelope).details).toEqual(envelope.details);
  });

  it("rejects unknown codes", () => {
    const result = errorResponseSchema.safeParse({
      statusCode: 400,
      error: "Bad Request",
      message: "nope",
      code: "SOMETHING_ELSE",
    });
    expect(result.success).toBe(false);
  });
});
