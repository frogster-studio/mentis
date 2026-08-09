import { describe, expect, it } from "vitest";
import { adminCardListQuerySchema } from "./admin/index";
import { appAccountStatsResponseSchema } from "./app/index";
import { errorResponseSchema } from "./shared/index";

describe("adminCardListQuerySchema", () => {
  it("defaults page to 1 and coerces numeric strings", () => {
    expect(adminCardListQuerySchema.parse({})).toEqual({ page: 1 });
    expect(adminCardListQuerySchema.parse({ page: "3" }).page).toBe(3);
  });

  it("rejects page below 1", () => {
    expect(adminCardListQuerySchema.safeParse({ page: "0" }).success).toBe(false);
  });
});

describe("appAccountStatsResponseSchema", () => {
  it("accepts PostgREST offset timestamps", () => {
    const parsed = appAccountStatsResponseSchema.parse({
      baselines: [],
      sessions: [
        {
          id: "7d9915fd-4a8b-4c9e-9d10-3a2b1c0d9e8f",
          themeId: "history",
          themeName: "History",
          points: 40,
          finishedAt: "2026-07-30T18:00:00+00:00",
        },
      ],
    });
    expect(parsed.sessions).toHaveLength(1);
  });
});

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
