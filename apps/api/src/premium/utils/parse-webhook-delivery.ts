import { PremiumEnvironmentEnum } from "@mentis/contracts/enums";
import { z } from "zod";
import type { WebhookResyncInput } from "../types/webhook-resync-input";

const uuidSchema = z.uuid();

const isPremiumEnvironment = (value: unknown): value is PremiumEnvironmentEnum =>
  value === PremiumEnvironmentEnum.SANDBOX || value === PremiumEnvironmentEnum.PRODUCTION;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const readEvent = (body: unknown): Record<string, unknown> | null => {
  if (body === null || typeof body !== "object" || !("event" in body)) return null;
  const event = (body as { event: unknown }).event;
  if (event === null || typeof event !== "object") return null;
  return event as Record<string, unknown>;
};

// Collect every app-user id the delivery names and keep only the ones in RevenueCat's own UUID format.
export const parseWebhookDelivery = (body: unknown): WebhookResyncInput => {
  const event = readEvent(body);
  if (event === null) {
    return { ownerIds: [], environment: null };
  }
  const single = typeof event.app_user_id === "string" ? [event.app_user_id] : [];
  const candidates = [
    ...single,
    ...asStringArray(event.transferred_from),
    ...asStringArray(event.transferred_to),
  ];
  const valid = candidates.filter((id) => uuidSchema.safeParse(id).success);
  const ownerIds = Array.from(new Set(valid));
  const environment = isPremiumEnvironment(event.environment) ? event.environment : null;
  return { ownerIds, environment };
};
