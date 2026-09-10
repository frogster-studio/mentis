import { describe, expect, it } from "vitest";
import { subscriptionTermsSentence } from "./subscription-terms";

describe("subscriptionTermsSentence", () => {
  it("names the App Store on iOS", () => {
    const sentence = subscriptionTermsSentence("ios");
    expect(sentence).toBe(
      "Abonnement mensuel renouvelé automatiquement au même prix, sauf annulation au moins 24 h avant la fin de la période. Gérez ou résiliez à tout moment dans les réglages de l'App Store.",
    );
  });

  it("names Google Play on Android", () => {
    const sentence = subscriptionTermsSentence("android");
    expect(sentence).toBe(
      "Abonnement mensuel renouvelé automatiquement au même prix, sauf annulation au moins 24 h avant la fin de la période. Gérez ou résiliez à tout moment dans les réglages de Google Play.",
    );
  });

  it("states the renewal price and the cancellation window Apple requires on the paywall", () => {
    for (const platform of ["ios", "android"] as const) {
      const sentence = subscriptionTermsSentence(platform);
      expect(sentence).toContain("mensuel");
      expect(sentence).toContain("au même prix");
      expect(sentence).toContain("24 h");
    }
  });

  it("names one store only, never both", () => {
    expect(subscriptionTermsSentence("ios")).not.toContain("Google Play");
    expect(subscriptionTermsSentence("android")).not.toContain("App Store");
  });
});
