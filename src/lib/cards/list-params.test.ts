import { describe, expect, it } from "vitest";

import { buildListHref, parseListParams } from "@/lib/cards/list-params";

describe("parseListParams", () => {
  it("returns the unfiltered first page for empty params", () => {
    expect(parseListParams({})).toEqual({
      search: "",
      type: undefined,
      tag: "",
      page: 1,
    });
  });

  it("reads search, filters, tag, and page from the URL", () => {
    expect(
      parseListParams({
        q: " Bastille ",
        type: "quiz",
        tag: " Histoire ",
        page: "3",
      }),
    ).toEqual({
      search: "Bastille",
      type: "quiz",
      tag: "histoire",
      page: 3,
    });
  });

  it("ignores unknown types instead of erroring", () => {
    const params = parseListParams({ type: "poem" });
    expect(params.type).toBeUndefined();
  });

  it("falls back to page 1 for missing, malformed, or non-positive pages", () => {
    expect(parseListParams({}).page).toBe(1);
    expect(parseListParams({ page: "abc" }).page).toBe(1);
    expect(parseListParams({ page: "0" }).page).toBe(1);
    expect(parseListParams({ page: "-2" }).page).toBe(1);
  });

  it("takes the first value when a param is repeated", () => {
    expect(parseListParams({ q: ["premier", "second"] }).search).toBe(
      "premier",
    );
  });
});

describe("buildListHref", () => {
  const params = parseListParams({
    q: "vase",
    type: "true-false",
    tag: "histoire",
    page: "2",
  });

  it("round-trips list state through a URL", () => {
    const href = buildListHref("/", params);
    expect(href).toBe("/?q=vase&type=true-false&tag=histoire&page=2");

    const query = Object.fromEntries(
      new URLSearchParams(href.slice(2)).entries(),
    );
    expect(parseListParams(query)).toEqual(params);
  });

  it("omits defaults so an unfiltered first page is the bare path", () => {
    expect(buildListHref("/", parseListParams({}))).toBe("/");
  });

  it("applies overrides for page controls and Tag chips", () => {
    expect(buildListHref("/", params, { page: 3 })).toBe(
      "/?q=vase&type=true-false&tag=histoire&page=3",
    );
    expect(buildListHref("/cards/abc", params, { tag: "géo", page: 1 })).toBe(
      "/cards/abc?q=vase&type=true-false&tag=g%C3%A9o",
    );
  });
});
