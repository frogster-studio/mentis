"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { normalizeEmail, verifyCredentials } from "@/lib/auth/credentials";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/auth/session";

export type LoginState = { error: string };

export async function login(
  _previousState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const valid = verifyCredentials(
    { email, password },
    {
      allowedEmails: process.env.ALLOWED_EMAILS,
      sharedPassword: process.env.SHARED_PASSWORD,
    },
  );
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }

  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = createSessionToken(
    { email: normalizeEmail(email), expiresAt },
    secret,
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  redirect("/");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
