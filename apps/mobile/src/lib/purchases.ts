import Constants from "expo-constants";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";

const config = Constants.expoConfig?.extra as {
  revenueCatIosApiKey: string;
  revenueCatAndroidApiKey: string;
};

let appUserId: string | null = null;

// logOut is never called — premium follows the store account, so identity only ever moves forward.
export const syncPurchasesIdentity = (userId: string | null) => {
  if (Platform.OS === "web" || !userId || userId === appUserId) {
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
