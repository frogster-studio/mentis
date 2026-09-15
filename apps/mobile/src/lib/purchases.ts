import Constants from "expo-constants";
import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type CustomerInfoUpdateListener,
  type PurchasesError,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";

const config = Constants.expoConfig?.extra as {
  revenueCatIosApiKey: string;
  revenueCatAndroidApiKey: string;
};

export const PURCHASES_SUPPORTED = Platform.OS !== "web";

let appUserId: string | null = null;
let isConfigured = false;

// A signed-out Player still reads the offer, so the SDK starts anonymous and identity only moves forward.
export const syncPurchasesIdentity = (userId: string | null) => {
  if (!PURCHASES_SUPPORTED) {
    return;
  }

  if (!isConfigured) {
    Purchases.configure({
      apiKey: Platform.OS === "ios" ? config.revenueCatIosApiKey : config.revenueCatAndroidApiKey,
      appUserID: userId,
    });
    isConfigured = true;
    appUserId = userId;
    return;
  }

  if (!userId || userId === appUserId) {
    return;
  }

  Purchases.logIn(userId);
  appUserId = userId;
};

export const readOfferings = (): Promise<PurchasesOfferings> => Purchases.getOfferings();

export const readCustomerInfo = (): Promise<CustomerInfo> => Purchases.getCustomerInfo();

export const purchasePackage = (pack: PurchasesPackage): Promise<CustomerInfo> =>
  Purchases.purchasePackage(pack).then((result) => result.customerInfo);

export const restorePurchases = (): Promise<CustomerInfo> => Purchases.restorePurchases();

export const isPurchaseCancelled = (error: unknown): boolean =>
  (error as PurchasesError | null)?.code ===
  Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;

export const watchCustomerInfo = (listener: CustomerInfoUpdateListener): (() => void) => {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
};
