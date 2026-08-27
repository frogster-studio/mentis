"use server";

import { redirect } from "next/navigation";
import {
  createEditorClient,
  isEditor,
  NO_EDITOR_ACCESS,
  signOutEditor,
} from "@/lib/auth/editor-session";

export type LoginState = { error: string };

export async function login(
  _previousState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createEditorClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Invalid email or password." };
  }

  if (!isEditor(data.user.app_metadata)) {
    await supabase.auth.signOut();
    return { error: NO_EDITOR_ACCESS };
  }

  redirect("/");
}

export async function logout(): Promise<void> {
  await signOutEditor();
  redirect("/login");
}
