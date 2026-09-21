import { describe, expect, it } from "vitest";
import {
  APPLE_SIGN_IN_LABEL,
  DELETE_ACCOUNT_CANCEL_LABEL,
  DELETE_ACCOUNT_CONFIRM_LABEL,
  DELETE_ACCOUNT_DONE,
  DELETE_ACCOUNT_ERROR,
  DELETE_ACCOUNT_LABEL,
  DELETE_ACCOUNT_TITLE,
  deleteAccountMessage,
  GOOGLE_SIGN_IN_LABEL,
  LEGAL_PRIVACY_LABEL,
  LEGAL_SUPPORT_LABEL,
  LEGAL_TERMS_LABEL,
  PROFILE_ACCOUNT_TAB_LABEL,
  PROFILE_CLOSE_LABEL,
  PROFILE_HISTORY_TAB_LABEL,
  PROFILE_SIGNED_OUT_NAME,
  PROFILE_STATS_EMPTY,
  PROFILE_STATS_TAB_LABEL,
  PROFILE_TITLE,
  PSEUDO_ERROR,
  PSEUDO_LOAD_ERROR,
  PSEUDO_PLACEHOLDER,
  PSEUDO_RULE,
  PSEUDO_SUBMIT_LABEL,
  PSEUDO_TAKEN_ERROR,
  PSEUDO_TITLE,
  SIGN_IN_CHIP_LABEL,
  SIGN_IN_ERROR,
  SIGN_IN_TITLE,
  SIGN_OUT_CANCEL_LABEL,
  SIGN_OUT_CONFIRM_LABEL,
  SIGN_OUT_LABEL,
  SIGN_OUT_MESSAGE,
  SIGN_OUT_TITLE,
  TRANSFER_ACCEPT_LABEL,
  TRANSFER_DECLINE_LABEL,
  TRANSFER_DONE_HOME,
  TRANSFER_ERROR,
  TRANSFER_MESSAGE,
  TRANSFER_TITLE,
} from "./constants";

describe("account constants", () => {
  it("exposes the French profile label", () => {
    expect(PROFILE_TITLE).toBe("Profil");
  });

  it("exposes non-empty French copy for every account string", () => {
    const strings = [
      PROFILE_CLOSE_LABEL,
      PROFILE_STATS_TAB_LABEL,
      PROFILE_HISTORY_TAB_LABEL,
      PROFILE_ACCOUNT_TAB_LABEL,
      PROFILE_SIGNED_OUT_NAME,
      PROFILE_STATS_EMPTY,
      SIGN_IN_CHIP_LABEL,
      SIGN_IN_TITLE,
      APPLE_SIGN_IN_LABEL,
      GOOGLE_SIGN_IN_LABEL,
      SIGN_OUT_LABEL,
      SIGN_OUT_TITLE,
      SIGN_OUT_MESSAGE,
      SIGN_OUT_CONFIRM_LABEL,
      SIGN_OUT_CANCEL_LABEL,
      SIGN_IN_ERROR,
      TRANSFER_TITLE,
      TRANSFER_MESSAGE,
      TRANSFER_ACCEPT_LABEL,
      TRANSFER_DECLINE_LABEL,
      TRANSFER_ERROR,
      TRANSFER_DONE_HOME,
      DELETE_ACCOUNT_LABEL,
      DELETE_ACCOUNT_TITLE,
      deleteAccountMessage(false),
      DELETE_ACCOUNT_CONFIRM_LABEL,
      DELETE_ACCOUNT_CANCEL_LABEL,
      DELETE_ACCOUNT_DONE,
      DELETE_ACCOUNT_ERROR,
      PSEUDO_TITLE,
      PSEUDO_PLACEHOLDER,
      PSEUDO_SUBMIT_LABEL,
      PSEUDO_RULE,
      PSEUDO_TAKEN_ERROR,
      PSEUDO_ERROR,
      PSEUDO_LOAD_ERROR,
      LEGAL_PRIVACY_LABEL,
      LEGAL_TERMS_LABEL,
      LEGAL_SUPPORT_LABEL,
    ];
    for (const copy of strings) {
      expect(copy.trim().length).toBeGreaterThan(0);
    }
  });

  it("names the third tab « Compte », so Review finds the deletion (App Store 5.1.1(v))", () => {
    expect(PROFILE_ACCOUNT_TAB_LABEL).toBe("Compte");
  });

  it("confirms the erasure in its own words, never the failure's", () => {
    expect(DELETE_ACCOUNT_DONE).not.toBe(DELETE_ACCOUNT_ERROR);
    expect(DELETE_ACCOUNT_DONE).toContain("supprimé");
  });

  it("names the provider on each sign-in button", () => {
    expect(APPLE_SIGN_IN_LABEL).toContain("Apple");
    expect(GOOGLE_SIGN_IN_LABEL).toContain("Google");
  });

  it("reassures that stats survive sign-out", () => {
    // The sign-out confirmation must say stats stay safe on the Account (PRD user story 20).
    expect(SIGN_OUT_MESSAGE).toContain("sécurité");
  });

  it("frames the Stats Transfer as a move onto the compte (PRD user story 11: a move, not a copy)", () => {
    expect(TRANSFER_MESSAGE).toContain("compte");
  });

  it("explains on the signed-out home that the stats now live on the compte", () => {
    expect(TRANSFER_DONE_HOME).toContain("compte");
  });

  it("states the pseudo rule the contract enforces, so the hint cannot drift from the 400", () => {
    expect(PSEUDO_RULE).toContain("3 à 20");
    expect(PSEUDO_RULE).toContain("_");
  });

  it("names the taken pseudo as its own failure, distinct from any other", () => {
    expect(PSEUDO_TAKEN_ERROR).not.toBe(PSEUDO_ERROR);
    expect(PSEUDO_TAKEN_ERROR).toContain("pris");
  });

  it("spells out exactly what account deletion erases, and that it cannot be undone", () => {
    const message = deleteAccountMessage(false);
    expect(message).toContain("compte");
    expect(message).toContain("statistiques");
    expect(message).toContain("irréversible");
  });

  it("says nothing about a subscription to a Player who has none", () => {
    expect(deleteAccountMessage(false)).not.toContain("abonnement");
    // Null is the tier still loading: the sentence would be a claim the app cannot yet make.
    expect(deleteAccountMessage(null)).toBe(deleteAccountMessage(false));
  });

  it("warns a Premium Player that the store keeps billing, and where to cancel (App Store 3.1.2)", () => {
    const message = deleteAccountMessage(true);
    expect(message.startsWith(deleteAccountMessage(false))).toBe(true);
    expect(message).toContain("abonnement");
    expect(message).toContain("facturation continue");
    expect(message).toContain("App Store");
    expect(message).toContain("Google Play");
  });

  it("names the three legal destinations the store review looks for (guideline 5.1.1)", () => {
    expect(LEGAL_PRIVACY_LABEL).toContain("confidentialité");
    expect(LEGAL_TERMS_LABEL).toContain("Conditions");
    expect(LEGAL_SUPPORT_LABEL).toBe("Support");
  });
});
