import { describe, expect, it } from "vitest";
import { PRIVACY_URL, SUPPORT_URL, TERMS_URL } from "@/lib/legal-links";

describe("legal links", () => {
  it("points at the three pages of the studio site", () => {
    expect(PRIVACY_URL).toBe("https://frogster-studio.com/mentis/privacy");
    expect(TERMS_URL).toBe("https://frogster-studio.com/mentis/terms");
    expect(SUPPORT_URL).toBe("https://frogster-studio.com/mentis/support");
  });
});
