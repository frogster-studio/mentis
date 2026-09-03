import { z } from "zod";

// Server truth per ADR 0006: active is the local premium_until > now compare, never a RevenueCat call.
export const appPremiumResponseSchema = z.object({
  active: z.boolean(),
  until: z.iso.datetime({ offset: true }).nullable(),
});
export type AppPremiumResponse = z.infer<typeof appPremiumResponseSchema>;
