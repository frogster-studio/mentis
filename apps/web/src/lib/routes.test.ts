import { describe, expect, it } from "vitest";

import { PAGE_PATHS, ROUTES } from "@/lib/routes";

describe("routes", () => {
  it("lists the five pages of the site", () => {
    expect(PAGE_PATHS).toEqual([
      "/",
      "/legal",
      "/mentis/privacy",
      "/mentis/terms",
      "/mentis/support",
    ]);
  });

  it("keeps the Mentis pages under /mentis", () => {
    expect(ROUTES.privacy.startsWith("/mentis/")).toBe(true);
    expect(ROUTES.terms.startsWith("/mentis/")).toBe(true);
    expect(ROUTES.support.startsWith("/mentis/")).toBe(true);
  });
});
