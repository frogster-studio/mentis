import { describe, expect, it } from "vitest";

import { cardSchema } from "@/lib/cards/schema";

const validAnecdote = {
  type: "anecdote",
  title: "Mendès France et le lait",
  payload: { body: "À la cantine…" },
};

describe("cardSchema", () => {
  it("accepts a valid Anecdote and defaults status, tags, and images", () => {
    const result = cardSchema.parse(validAnecdote);
    expect(result).toEqual({
      type: "anecdote",
      title: "Mendès France et le lait",
      tags: [],
      status: "draft",
      images: [],
      payload: { body: "À la cantine…" },
    });
  });

  it("preserves line breaks in the body", () => {
    const body = "Première ligne.\n\nDeuxième ligne.\nTroisième.";
    const result = cardSchema.parse({
      ...validAnecdote,
      payload: { body },
    });
    expect(result.payload.body).toBe(body);
  });

  it("rejects a missing Title", () => {
    const { title: _title, ...withoutTitle } = validAnecdote;
    expect(cardSchema.safeParse(withoutTitle).success).toBe(false);
  });

  it("rejects an empty or whitespace-only Title", () => {
    for (const title of ["", "   "]) {
      const result = cardSchema.safeParse({ ...validAnecdote, title });
      expect(result.success).toBe(false);
    }
  });

  it("trims whitespace around the Title", () => {
    const result = cardSchema.parse({
      ...validAnecdote,
      title: "  Mendès France  ",
    });
    expect(result.title).toBe("Mendès France");
  });

  it("rejects an unknown type value", () => {
    expect(
      cardSchema.safeParse({ ...validAnecdote, type: "haiku" }).success,
    ).toBe(false);
  });

  it("rejects a missing type", () => {
    const { type: _type, ...withoutType } = validAnecdote;
    expect(cardSchema.safeParse(withoutType).success).toBe(false);
  });

  it("rejects an unknown status value", () => {
    expect(
      cardSchema.safeParse({ ...validAnecdote, status: "archived" }).success,
    ).toBe(false);
  });

  it("rejects more than three images", () => {
    const images = [0, 1, 2, 3].map((order) => ({
      path: `cards/x-${order}.webp`,
      order,
    }));
    expect(cardSchema.safeParse({ ...validAnecdote, images }).success).toBe(
      false,
    );
  });
});
