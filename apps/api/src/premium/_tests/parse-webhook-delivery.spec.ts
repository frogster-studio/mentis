import { PremiumEnvironmentEnum } from "@mentis/contracts/enums";
import { describe, expect, it } from "vitest";
import { parseWebhookDelivery } from "../utils/parse-webhook-delivery";

const OWNER_A = "11111111-1111-4111-8111-111111111111";
const OWNER_B = "22222222-2222-4222-8222-222222222222";

describe("parseWebhookDelivery", () => {
  it("keeps the single event's app_user_id when it parses as a UUID", () => {
    expect(
      parseWebhookDelivery({
        event: { type: "INITIAL_PURCHASE", app_user_id: OWNER_A, environment: "SANDBOX" },
      }),
    ).toEqual({ ownerIds: [OWNER_A], environment: PremiumEnvironmentEnum.SANDBOX });
  });

  it("collects both sides of a TRANSFER, deduped", () => {
    expect(
      parseWebhookDelivery({
        event: {
          type: "TRANSFER",
          transferred_from: [OWNER_A],
          transferred_to: [OWNER_B, OWNER_B],
          environment: "PRODUCTION",
        },
      }),
    ).toEqual({ ownerIds: [OWNER_A, OWNER_B], environment: PremiumEnvironmentEnum.PRODUCTION });
  });

  it("drops any id that is not a UUID", () => {
    expect(
      parseWebhookDelivery({
        event: { app_user_id: "not-a-uuid", transferred_to: [OWNER_A, "$RCAnonymousID:abc"] },
      }),
    ).toEqual({ ownerIds: [OWNER_A], environment: null });
  });

  it("returns no owners and no environment for an unparseable body", () => {
    expect(parseWebhookDelivery({})).toEqual({ ownerIds: [], environment: null });
    expect(parseWebhookDelivery(null)).toEqual({ ownerIds: [], environment: null });
    expect(parseWebhookDelivery("garbage")).toEqual({ ownerIds: [], environment: null });
  });

  it("nulls the environment when it is missing or unknown", () => {
    expect(
      parseWebhookDelivery({ event: { app_user_id: OWNER_A, environment: "STAGING" } }).environment,
    ).toBeNull();
    expect(parseWebhookDelivery({ event: { app_user_id: OWNER_A } }).environment).toBeNull();
  });
});
