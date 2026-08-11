import { type CookieMethodsServer, createServerClient } from "@supabase/ssr";

// The hosted project's public coordinates — none of them is a secret.
export function supabaseProject(): { url: string; publishableKey: string } {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set");
  }
  return { url, publishableKey };
}

// Admin never runs a browser Supabase client, so the session cookies stay unreadable to scripts.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
} as const;

// Callers differ only in where their cookies live: the proxy reads and writes a
// request/response pair, everything else the `next/headers` store.
export function createSupabaseClient(cookies: CookieMethodsServer) {
  const { url, publishableKey } = supabaseProject();
  return createServerClient(url, publishableKey, { cookieOptions: COOKIE_OPTIONS, cookies });
}
