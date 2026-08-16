import { describe, expect, it } from "vitest";
import {
  ACCOUNT_PITCH,
  ACCOUNT_TITLE,
  DELETE_ACCOUNT_CANCEL_LABEL,
  DELETE_ACCOUNT_CONFIRM_LABEL,
  DELETE_ACCOUNT_ERROR,
  DELETE_ACCOUNT_LABEL,
  DELETE_ACCOUNT_MESSAGE,
  DELETE_ACCOUNT_TITLE,
  GOOGLE_SIGN_IN_LABEL,
  SIGN_IN_ERROR,
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
  it("exposes the French account label", () => {
    expect(ACCOUNT_TITLE).toBe("Compte");
  });

  it("exposes non-empty French copy for every account string", () => {
    const strings = [
      ACCOUNT_PITCH,
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
      DELETE_ACCOUNT_MESSAGE,
      DELETE_ACCOUNT_CONFIRM_LABEL,
      DELETE_ACCOUNT_CANCEL_LABEL,
      DELETE_ACCOUNT_ERROR,
    ];
    for (const copy of strings) {
      expect(copy.trim().length).toBeGreaterThan(0);
    }
  });

  it("names the provider on the Google button", () => {
    // The custom Google button carries its own label (unlike Apple's OS-drawn button).
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

  it("spells out exactly what account deletion erases, and that it cannot be undone", () => {
    expect(DELETE_ACCOUNT_MESSAGE).toContain("compte");
    expect(DELETE_ACCOUNT_MESSAGE).toContain("statistiques");
    expect(DELETE_ACCOUNT_MESSAGE).toContain("irréversible");
  });
});
