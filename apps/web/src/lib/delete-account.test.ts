import { describe, expect, it } from "vitest";

import {
  buildDeletionMailto,
  DELETION_EMAIL_BODY,
  DELETION_EMAIL_SUBJECT,
  IN_APP_STEPS,
} from "@/lib/delete-account";

describe("delete-account", () => {
  it("names the subject the store reviewer reads", () => {
    expect(DELETION_EMAIL_SUBJECT).toBe("Demande de suppression de mon compte Mentis");
  });

  it("asks for the three fields that identify the account", () => {
    expect(DELETION_EMAIL_BODY).toContain("- Email du compte : …");
    expect(DELETION_EMAIL_BODY).toContain("- Pseudo : …");
    expect(DELETION_EMAIL_BODY).toContain(
      "- Méthode de connexion : Google / Apple / Je ne sais plus",
    );
  });

  it("keeps every template line on its own line", () => {
    expect(DELETION_EMAIL_BODY.split("\n")).toHaveLength(6);
    expect(DELETION_EMAIL_BODY.startsWith("Bonjour,\n")).toBe(true);
  });

  it("encodes the subject and the body into the mailto", () => {
    const mailto = buildDeletionMailto("mentis@frogster-studio.com");

    expect(mailto.startsWith("mailto:mentis@frogster-studio.com?")).toBe(true);
    expect(mailto).toContain(`subject=${encodeURIComponent(DELETION_EMAIL_SUBJECT)}`);
    expect(mailto).toContain(`body=${encodeURIComponent(DELETION_EMAIL_BODY)}`);
    expect(mailto).toContain("%0A");
    expect(mailto).not.toContain(" ");
  });

  it("walks the player through the in-app deletion", () => {
    expect(IN_APP_STEPS[0]).toContain("Mentis");
    expect(IN_APP_STEPS).toContain("Appuyez sur « Supprimer mon compte ».");
    expect(IN_APP_STEPS.at(-1)).toContain("Supprimer");
  });
});
