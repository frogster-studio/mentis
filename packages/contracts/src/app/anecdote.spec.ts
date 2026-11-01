import { describe, expect, it } from "vitest";
import { appAnecdoteDrawQuerySchema, appAnecdoteDrawResponseSchema } from "./anecdote";

describe("appAnecdoteDrawQuerySchema", () => {
  it("draws 3 when nothing is asked for", () => {
    expect(appAnecdoteDrawQuerySchema.parse({})).toEqual({ n: 3 });
  });

  it("coerces the query string n at both bounds", () => {
    expect(appAnecdoteDrawQuerySchema.parse({ n: "1" })).toEqual({ n: 1 });
    expect(appAnecdoteDrawQuerySchema.parse({ n: "50" })).toEqual({ n: 50 });
  });

  it("rejects n outside 1-50 or not an integer", () => {
    expect(appAnecdoteDrawQuerySchema.safeParse({ n: "0" }).success).toBe(false);
    expect(appAnecdoteDrawQuerySchema.safeParse({ n: "51" }).success).toBe(false);
    expect(appAnecdoteDrawQuerySchema.safeParse({ n: "2.5" }).success).toBe(false);
  });
});

describe("appAnecdoteDrawResponseSchema", () => {
  it("keeps the id and the text alone", () => {
    expect(
      appAnecdoteDrawResponseSchema.parse([
        { id: "a1", text: "Le **miel** ne se périme pas.", createdAt: "2026-11-01T00:00:00Z" },
      ]),
    ).toEqual([{ id: "a1", text: "Le **miel** ne se périme pas." }]);
  });

  it("rejects a row without text", () => {
    expect(appAnecdoteDrawResponseSchema.safeParse([{ id: "a1" }]).success).toBe(false);
  });
});
