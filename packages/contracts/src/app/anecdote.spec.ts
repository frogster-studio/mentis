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
  const TEXT = "Le **miel** ne se périme pas.";
  const IMAGE_URL = "https://cdn.example.com/storage/v1/object/public/anecdote-images/a1/u1.webp";

  it("keeps the id, the text and the imageUrl alone", () => {
    expect(
      appAnecdoteDrawResponseSchema.parse([
        { id: "a1", text: TEXT, imageUrl: IMAGE_URL, createdAt: "2026-11-01T00:00:00Z" },
        { id: "a2", text: TEXT, imageUrl: null },
      ]),
    ).toEqual([
      { id: "a1", text: TEXT, imageUrl: IMAGE_URL },
      { id: "a2", text: TEXT, imageUrl: null },
    ]);
  });

  it.each([
    ["without text", { id: "a1", imageUrl: null }],
    ["without the imageUrl key", { id: "a1", text: TEXT }],
    ["with a bucket path for imageUrl", { id: "a1", text: TEXT, imageUrl: "a1/u1.webp" }],
  ])("rejects a row %s", (_case, row) => {
    expect(appAnecdoteDrawResponseSchema.safeParse([row]).success).toBe(false);
  });
});
