import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import { type ZodType, z } from "zod";

// The whole binding between zod and Nest — no nestjs-zod, no class-validator.
@Injectable()
export class ZodValidationPipe<T extends ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: "VALIDATION_FAILED",
        message: "Request validation failed",
        details: z.flattenError(result.error),
      });
    }
    return result.data;
  }
}
