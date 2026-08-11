import { describe, expect, it, vi } from "vitest";

const { signOutEditor } = vi.hoisted(() => ({ signOutEditor: vi.fn() }));

vi.mock("@/lib/auth/editor-session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/editor-session")>()),
  signOutEditor,
}));

import { GET } from "@/app/sign-out/route";

describe("the sign-out route", () => {
  it("clears the session and sends the editor to the login page", async () => {
    const response = await GET(new Request("https://admin.test/sign-out"));

    expect(signOutEditor).toHaveBeenCalledOnce();
    expect(response.headers.get("location")).toBe("https://admin.test/login");
  });

  it("carries the no-editor-access notice through to the login page", async () => {
    const response = await GET(new Request("https://admin.test/sign-out?error=no-editor-access"));

    expect(response.headers.get("location")).toBe(
      "https://admin.test/login?error=no-editor-access",
    );
  });

  it("ignores an unknown error param rather than echoing it", async () => {
    const response = await GET(new Request("https://admin.test/sign-out?error=%3Cscript%3E"));

    expect(response.headers.get("location")).toBe("https://admin.test/login");
  });
});
