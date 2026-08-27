import type { Metadata } from "next";

import { NO_EDITOR_ACCESS, NO_EDITOR_ACCESS_PARAM } from "@/lib/auth/editor-session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in — Mentis",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl tracking-tight">Mentis</h1>
      <LoginForm notice={error === NO_EDITOR_ACCESS_PARAM ? NO_EDITOR_ACCESS : undefined} />
    </main>
  );
}
