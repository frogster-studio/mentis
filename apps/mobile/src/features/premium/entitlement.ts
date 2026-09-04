import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from "react-native-purchases";

const PREMIUM_ENTITLEMENT_ID = "premium";

export function isPremiumActive(info: CustomerInfo): boolean {
  return Object.hasOwn(info.entitlements.active, PREMIUM_ENTITLEMENT_ID);
}

export function premiumPackageOf(offerings: PurchasesOfferings): PurchasesPackage | null {
  return offerings.current?.availablePackages[0] ?? null;
}
