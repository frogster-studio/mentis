import { NextResponse } from "next/server";

import { NO_EDITOR_ACCESS_PARAM, signOutEditor } from "@/lib/auth/editor-session";

// Where the session cookies actually get cleared: an RSC render cannot write them.
export async function GET(request: Request): Promise<NextResponse> {
  await signOutEditor();

  const noEditorAccess = new URL(request.url).searchParams.get("error") === NO_EDITOR_ACCESS_PARAM;
  return NextResponse.redirect(
    new URL(noEditorAccess ? `/login?error=${NO_EDITOR_ACCESS_PARAM}` : "/login", request.url),
  );
}
