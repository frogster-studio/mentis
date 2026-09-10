import { describe, expect, it } from "vitest";
import { profileInitial } from "./profile-initial";

describe("profileInitial", () => {
  it("takes the Pseudo's first character, upper-cased", () => {
    expect(profileInitial("hugo")).toBe("H");
    expect(profileInitial("Player_42")).toBe("P");
    expect(profileInitial("éléonore")).toBe("É");
  });

  it("ignores the space a Pseudo may start with", () => {
    expect(profileInitial("  zoé")).toBe("Z");
  });

  it("says nothing while the Pseudo is missing or empty", () => {
    expect(profileInitial(undefined)).toBeNull();
    expect(profileInitial("")).toBeNull();
    expect(profileInitial("   ")).toBeNull();
  });
});
