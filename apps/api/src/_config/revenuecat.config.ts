import type { Env } from "./env.config";

// The API's first outbound-HTTP seam: an injectable provider so tests fake it at DI, not fetch.
export const REVENUECAT = Symbol("REVENUECAT");

// Read leniently: RevenueCat's subscriber body is untrusted input for the mapper to interpret.
export interface RevenueCatSubscriber {
  entitlements?: Record<string, { expires_date?: string | null } | undefined | null> | null;
}

export interface RevenueCatClient {
  fetchSubscriber(appUserId: string): Promise<RevenueCatSubscriber>;
}

export const createRevenueCatClient = (env: Env): RevenueCatClient => ({
  async fetchSubscriber(appUserId: string): Promise<RevenueCatSubscriber> {
    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
      { headers: { Authorization: `Bearer ${env.REVENUECAT_REST_KEY}` } },
    );
    if (!response.ok) {
      throw new Error(`RevenueCat REST returned ${response.status}`);
    }
    const body = (await response.json()) as { subscriber?: RevenueCatSubscriber };
    return body.subscriber ?? {};
  },
});
