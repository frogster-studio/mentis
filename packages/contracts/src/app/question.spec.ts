import { describe, expect, it } from "vitest";
import { appQuestionDrawQuerySchema } from "./question";

describe("appQuestionDrawQuerySchema", () => {
  it("draws 10 across every Theme when nothing is asked for", () => {
    expect(appQuestionDrawQuerySchema.parse({})).toEqual({ n: 10 });
  });

  it("coerces the query string n", () => {
    expect(appQuestionDrawQuerySchema.parse({ theme: "les-simpson", n: "25" })).toEqual({
      theme: "les-simpson",
      n: 25,
    });
  });

  it("rejects n outside 1-50", () => {
    expect(appQuestionDrawQuerySchema.safeParse({ n: "0" }).success).toBe(false);
    expect(appQuestionDrawQuerySchema.safeParse({ n: "51" }).success).toBe(false);
    expect(appQuestionDrawQuerySchema.safeParse({ n: "1.5" }).success).toBe(false);
  });

  it("rejects an empty theme", () => {
    expect(appQuestionDrawQuerySchema.safeParse({ theme: "" }).success).toBe(false);
  });
});
