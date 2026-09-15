import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { avatarUrlOf, firstNameOf, fullNameOf } from "./user-metadata";

const userWith = (metadata: Record<string, unknown>): User =>
  ({ user_metadata: metadata }) as unknown as User;

describe("user metadata", () => {
  it("reads the full name and its first word", () => {
    const user = userWith({ full_name: "Hugo Bayoud" });
    expect(fullNameOf(user)).toBe("Hugo Bayoud");
    expect(firstNameOf(user)).toBe("Hugo");
  });

  it("treats a missing, empty or non-string value as absent", () => {
    expect(fullNameOf(undefined)).toBeUndefined();
    expect(fullNameOf(userWith({}))).toBeUndefined();
    expect(fullNameOf(userWith({ full_name: "" }))).toBeUndefined();
    expect(avatarUrlOf(userWith({ avatar_url: 42 }))).toBeUndefined();
  });

  it("reads the provider's avatar url", () => {
    expect(avatarUrlOf(userWith({ avatar_url: "https://example.com/me.png" }))).toBe(
      "https://example.com/me.png",
    );
  });
});
