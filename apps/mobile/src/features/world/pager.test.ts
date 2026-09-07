import { describe, expect, it } from "vitest";
import { clampPage } from "./pager";

describe("clampPage", () => {
  it("keeps a page the Season holds", () => {
    expect(clampPage(1, 3)).toBe(1);
    expect(clampPage(2, 3)).toBe(2);
    expect(clampPage(3, 3)).toBe(3);
  });

  it("falls back onto the last page of a Season that shrank", () => {
    expect(clampPage(4, 3)).toBe(3);
    expect(clampPage(340, 2)).toBe(2);
  });

  it("shows the first page when nobody is ranked", () => {
    expect(clampPage(1, 0)).toBe(1);
    expect(clampPage(7, 0)).toBe(1);
  });

  it("never answers below the first page", () => {
    expect(clampPage(0, 3)).toBe(1);
    expect(clampPage(-2, 3)).toBe(1);
  });
});
