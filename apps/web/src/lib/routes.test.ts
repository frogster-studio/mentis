import { describe, expect, it } from "vitest";

import { PAGE_PATHS, ROUTES } from "@/lib/routes";

describe("routes", () => {
  it("lists the landing page and the existing pages", () => {
    expect(PAGE_PATHS).toEqual([
      "/",
      "/mentis",
      "/mentis/app",
      "/legal",
      "/mentis/privacy",
      "/mentis/terms",
      "/mentis/support",
      "/mentis/delete-account",
    ]);
  });

  it("keeps the Mentis pages under /mentis", () => {
    expect(ROUTES.app.startsWith("/mentis/")).toBe(true);
    expect(ROUTES.privacy.startsWith("/mentis/")).toBe(true);
    expect(ROUTES.terms.startsWith("/mentis/")).toBe(true);
    expect(ROUTES.support.startsWith("/mentis/")).toBe(true);
    expect(ROUTES.deleteAccount.startsWith("/mentis/")).toBe(true);
  });
});
