import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

// Server actions are reachable by direct POST, so the route guard in the
// proxy is not enough on its own.
export async function requireSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token, {
    secret: process.env.SESSION_SECRET ?? "",
    now: Date.now(),
  });
  if (!session) {
    redirect("/login");
  }
}
