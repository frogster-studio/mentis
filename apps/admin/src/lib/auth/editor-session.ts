import { cookies } from "next/headers";

import { createSupabaseClient } from "@/lib/supabase";

export const NO_EDITOR_ACCESS = "This account has no editor access.";

// Carries the message above through the redirect that follows a revoked claim.
export const NO_EDITOR_ACCESS_PARAM = "no-editor-access";

export async function createEditorClient() {
  const cookieStore = await cookies();
  return createSupabaseClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // A Server Component cannot write cookies; the proxy refreshes instead.
      }
    },
  });
}

// Login gates on this claim, so a signed-in session is always an editor session.
export function isEditor(appMetadata: Record<string, unknown>): boolean {
  return appMetadata.role === "editor";
}

export async function signOutEditor(): Promise<void> {
  const supabase = await createEditorClient();
  await supabase.auth.signOut();
}
