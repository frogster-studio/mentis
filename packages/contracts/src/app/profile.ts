import { z } from "zod";

export const appPseudoSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[A-Za-z0-9_]+$/);

export const appProfileResponseSchema = z.object({ pseudo: appPseudoSchema });
export type AppProfileResponse = z.infer<typeof appProfileResponseSchema>;

export const appPseudoInputSchema = z.object({ pseudo: appPseudoSchema });
export type AppPseudoInput = z.infer<typeof appPseudoInputSchema>;
