import { useEffect, useState } from "react";
import type { CustomerInfo } from "react-native-purchases";
import { useAuthStore } from "@/features/account/auth-store";
import { isPremiumActive } from "@/features/premium/entitlement";
import { PURCHASES_SUPPORTED, readCustomerInfo, watchCustomerInfo } from "@/lib/purchases";

// CustomerInfo is the SDK's offline-cached truth, so the paid tier never flickers with connectivity.
export function useIsPremium(): boolean | null {
  const userId = useAuthStore((state) => state.session?.user.id);
  // Null until the first CustomerInfo lands, so a Premium Account is never offered a purchase.
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    setIsPremium(PURCHASES_SUPPORTED && userId ? null : false);
    if (!PURCHASES_SUPPORTED || !userId) {
      return;
    }

    let watching = true;
    const apply = (info: CustomerInfo) => {
      if (watching) {
        setIsPremium(isPremiumActive(info));
      }
    };
    const stopWatching = watchCustomerInfo(apply);
    // A read before the SDK is configured rejects; the listener still delivers once identity lands.
    readCustomerInfo().then(apply, () => undefined);

    return () => {
      watching = false;
      stopWatching();
    };
  }, [userId]);

  return isPremium;
}
