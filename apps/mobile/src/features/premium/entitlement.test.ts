import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from "react-native-purchases";
import { describe, expect, it } from "vitest";
import { isPremiumActive, premiumPackageOf } from "./entitlement";

function customerInfo(activeEntitlements: string[]): CustomerInfo {
  const active = Object.fromEntries(activeEntitlements.map((id) => [id, { identifier: id }]));
  return { entitlements: { active } } as unknown as CustomerInfo;
}

function offerings(packages: string[] | null): PurchasesOfferings {
  const current =
    packages === null
      ? null
      : { availablePackages: packages.map((identifier) => ({ identifier })) };
  return { current } as unknown as PurchasesOfferings;
}

describe("isPremiumActive", () => {
  it("reads the premium entitlement as the paid tier", () => {
    expect(isPremiumActive(customerInfo(["premium"]))).toBe(true);
  });

  it("stays false when no entitlement is active", () => {
    expect(isPremiumActive(customerInfo([]))).toBe(false);
  });

  it("ignores another entitlement being active", () => {
    expect(isPremiumActive(customerInfo(["pro"]))).toBe(false);
  });
});

describe("premiumPackageOf", () => {
  it("takes the current offering's single package", () => {
    const pack = premiumPackageOf(offerings(["monthly"]));
    expect((pack as PurchasesPackage).identifier).toBe("monthly");
  });

  it("is null when no offering is current", () => {
    expect(premiumPackageOf(offerings(null))).toBeNull();
  });

  it("is null when the current offering sells nothing", () => {
    expect(premiumPackageOf(offerings([]))).toBeNull();
  });
});
