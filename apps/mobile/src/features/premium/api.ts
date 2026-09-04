import { useQuery } from "@tanstack/react-query";
import type { CustomerInfo, PurchasesPackage } from "react-native-purchases";
import { premiumPackageOf } from "@/features/premium/entitlement";
import { isPurchaseCancelled, purchasePackage, readOfferings } from "@/lib/purchases";

export const premiumKeys = {
  offering: ["premium", "offering"] as const,
};

// The price must be the store's own, so the offering is re-read every time the paywall opens.
export function usePremiumOffering(enabled: boolean) {
  return useQuery({
    queryKey: premiumKeys.offering,
    queryFn: async () => premiumPackageOf(await readOfferings()),
    enabled,
  });
}

// Backing out of the store sheet resolves to null: a cancel is a choice, never an error to show.
export async function purchasePremium(pack: PurchasesPackage): Promise<CustomerInfo | null> {
  try {
    return await purchasePackage(pack);
  } catch (error) {
    if (isPurchaseCancelled(error)) {
      return null;
    }
    throw error;
  }
}
