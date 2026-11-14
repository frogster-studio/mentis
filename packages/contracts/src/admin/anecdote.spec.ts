import { describe, expect, it } from "vitest";
import {
  adminAnecdoteListResponseSchema,
  adminAnecdoteResponseSchema,
  adminAnecdoteWriteSchema,
} from "./anecdote";

const TEXT = "Le **Piton de la Fournaise** entre en éruption __presque chaque année__.";

describe("adminAnecdoteWriteSchema", () => {
  it("keeps the Anecdote as the Editor typed it, trimmed, its emphasis markers intact", () => {
    expect(adminAnecdoteWriteSchema.parse({ text: `  ${TEXT}  ` })).toEqual({ text: TEXT });
  });

  it("takes an Anecdote of exactly 140 characters once trimmed, markers counted", () => {
    const text = `**${"a".repeat(136)}**`;
    expect(adminAnecdoteWriteSchema.parse({ text: `  ${text}  ` }).text).toHaveLength(140);
  });

  it.each([
    ["no text", { text: "   " }],
    ["141 characters once trimmed", { text: ` ${"a".repeat(141)} ` }],
    ["a text the markers push past 140", { text: `**${"a".repeat(137)}**` }],
    ["no text key at all", {}],
  ])("refuses an Anecdote with %s", (_case, anecdote) => {
    expect(adminAnecdoteWriteSchema.safeParse(anecdote).success).toBe(false);
  });
});

describe("adminAnecdoteResponseSchema", () => {
  const id = "7b4e0d3a-0000-4000-8000-000000000001";

  it("carries the id, the text and the image path, holding the timestamps back", () => {
    const image = `${id}/upload-1.webp`;
    const stored = { id, text: TEXT, image, createdAt: new Date(), updatedAt: new Date() };
    expect(adminAnecdoteResponseSchema.parse(stored)).toEqual({ id, text: TEXT, image });
  });

  it("carries a null image for an Anecdote without one", () => {
    expect(adminAnecdoteResponseSchema.parse({ id, text: TEXT, image: null })).toEqual({
      id,
      text: TEXT,
      image: null,
    });
  });

  it("refuses a response missing the image key", () => {
    expect(adminAnecdoteResponseSchema.safeParse({ id, text: TEXT }).success).toBe(false);
  });
});

describe("adminAnecdoteListResponseSchema", () => {
  const id = "7b4e0d3a-0000-4000-8000-000000000001";
  const imageUrl = `https://stub.supabase.co/storage/v1/object/public/anecdote-images/${id}/upload-1.webp`;

  it("carries each Anecdote's id, text and image URL, holding the stored path back", () => {
    const listed = { id, text: TEXT, imageUrl, image: `${id}/upload-1.webp` };
    expect(adminAnecdoteListResponseSchema.parse([listed])).toEqual([{ id, text: TEXT, imageUrl }]);
  });

  it("carries a null image URL for an Anecdote without an image", () => {
    const listed = [{ id, text: TEXT, imageUrl: null }];
    expect(adminAnecdoteListResponseSchema.parse(listed)).toEqual(listed);
  });

  it("refuses an image that is a bare path", () => {
    const listed = [{ id, text: TEXT, imageUrl: `${id}/upload-1.webp` }];
    expect(adminAnecdoteListResponseSchema.safeParse(listed).success).toBe(false);
  });
});
