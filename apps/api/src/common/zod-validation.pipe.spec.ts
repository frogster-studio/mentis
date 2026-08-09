import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ZodValidationPipe } from "./zod-validation.pipe";

const schema = z.object({ page: z.coerce.number().int().min(1).default(1) });

describe("ZodValidationPipe", () => {
  it("returns the parsed (transformed) value", () => {
    const pipe = new ZodValidationPipe(schema);
    expect(pipe.transform({ page: "2" })).toEqual({ page: 2 });
    expect(pipe.transform({})).toEqual({ page: 1 });
  });

  it("throws a BadRequestException carrying VALIDATION_FAILED and flattened issues", () => {
    const pipe = new ZodValidationPipe(schema);
    try {
      pipe.transform({ page: "0" });
      expect.unreachable("expected the pipe to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as Record<string, unknown>;
      expect(response.code).toBe("VALIDATION_FAILED");
      expect(response.details).toBeDefined();
    }
  });
});
