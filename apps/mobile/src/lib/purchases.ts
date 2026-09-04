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

// logOut is never called — premium follows the store account, so identity only ever moves forward.
export const syncPurchasesIdentity = (userId: string | null) => {
  if (!PURCHASES_SUPPORTED || !userId || userId === appUserId) {
    return;
  }

  if (appUserId === null) {
    Purchases.configure({
      apiKey: Platform.OS === "ios" ? config.revenueCatIosApiKey : config.revenueCatAndroidApiKey,
      appUserID: userId,
    });
  } else {
    Purchases.logIn(userId);
  }

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
