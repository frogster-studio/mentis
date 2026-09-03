import { describe, expect, it } from "vitest";
import { appPremiumResponseSchema } from "./premium";

describe("appPremiumResponseSchema", () => {
  it("accepts an active response carrying an ISO expiry", () => {
    const response = { active: true, until: "2027-01-01T00:00:00.000Z" };
    expect(appPremiumResponseSchema.parse(response)).toEqual(response);
  });

  it("accepts an ISO datetime with a UTC offset", () => {
    const response = { active: true, until: "2027-01-01T12:00:00+02:00" };
    expect(appPremiumResponseSchema.parse(response)).toEqual(response);
  });

  it("accepts an inactive response with a null until", () => {
    const response = { active: false, until: null };
    expect(appPremiumResponseSchema.parse(response)).toEqual(response);
  });

  it.each(["yesterday", "2027-01-01", "", "1735689600"])(
    "rejects the malformed until %p",
    (until) => {
      expect(appPremiumResponseSchema.safeParse({ active: true, until }).success).toBe(false);
    },
  );

  it("rejects a non-boolean active", () => {
    expect(appPremiumResponseSchema.safeParse({ active: "yes", until: null }).success).toBe(false);
  });

  it("rejects a missing until — null is required to carry the inactive shape", () => {
    expect(appPremiumResponseSchema.safeParse({ active: false }).success).toBe(false);
  });
});
