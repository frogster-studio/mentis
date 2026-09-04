import type { Env } from "./env.config";

// The API's first outbound-HTTP seam: an injectable provider so tests fake it at DI, not fetch.
export const REVENUECAT = Symbol("REVENUECAT");

// Read leniently: RevenueCat's body is untrusted input for the mapper to interpret.
export interface RevenueCatEntitlement {
  id?: string | null;
  lookup_key?: string | null;
}

export interface RevenueCatEntitlementList {
  items?: Array<RevenueCatEntitlement | null> | null;
}

export interface RevenueCatActiveEntitlement {
  entitlement_id?: string | null;
  expires_at?: number | null;
}

export interface RevenueCatActiveEntitlementList {
  items?: Array<RevenueCatActiveEntitlement | null> | null;
}

export interface RevenueCatClient {
  fetchEntitlements(): Promise<RevenueCatEntitlementList>;
  fetchActiveEntitlements(appUserId: string): Promise<RevenueCatActiveEntitlementList>;
}

const get = (env: Env, path: string): Promise<Response> =>
  fetch(`https://api.revenuecat.com/${path}`, {
    headers: { Authorization: `Bearer ${env.REVENUECAT_REST_KEY}` },
  });

const parseOrThrow = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    // RevenueCat names the cause in the body.
    throw new Error(`RevenueCat REST returned ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as T;
};

export const createRevenueCatClient = (env: Env): RevenueCatClient => ({
  async fetchEntitlements(): Promise<RevenueCatEntitlementList> {
    const project = encodeURIComponent(env.REVENUECAT_PROJECT_ID);
    return parseOrThrow(await get(env, `v2/projects/${project}/entitlements`));
  },

  async fetchActiveEntitlements(appUserId: string): Promise<RevenueCatActiveEntitlementList> {
    const project = encodeURIComponent(env.REVENUECAT_PROJECT_ID);
    const customer = encodeURIComponent(appUserId);
    const path = `v2/projects/${project}/customers/${customer}/active_entitlements`;
    const response = await get(env, path);
    // A customer RevenueCat has never seen holds no active entitlements.
    if (response.status === 404) {
      return { items: [] };
    }
    return parseOrThrow(response);
  },
});
