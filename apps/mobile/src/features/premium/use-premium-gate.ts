import { usePaywallStore } from "@/features/premium/paywall-store";
import { useIsPremium } from "@/features/premium/use-is-premium";
import { PURCHASES_SUPPORTED } from "@/lib/purchases";

// The API still enforces Premium; an unknown tier goes through and a refusal opens the paywall there.
export function usePremiumGate() {
  const isPremium = useIsPremium();
  const openPaywall = usePaywallStore((state) => state.open);

  return (premiumAction: () => void) => {
    if (PURCHASES_SUPPORTED && isPremium === false) {
      openPaywall();
      return;
    }
    premiumAction();
  };
}
