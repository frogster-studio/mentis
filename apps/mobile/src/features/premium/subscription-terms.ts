import {
  PAYWALL_TERMS_ANDROID_STORE,
  PAYWALL_TERMS_INTRO,
  PAYWALL_TERMS_IOS_STORE,
} from "@/features/premium/constants";

export type StorePlatform = "ios" | "android";

// Pure over the platform, never reading Platform itself, so the sentence is testable in node.
export function subscriptionTermsSentence(platform: StorePlatform): string {
  const store = platform === "ios" ? PAYWALL_TERMS_IOS_STORE : PAYWALL_TERMS_ANDROID_STORE;
  return `${PAYWALL_TERMS_INTRO} ${store}.`;
}
