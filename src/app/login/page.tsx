import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in — Mentis",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-background p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-semibold text-3xl text-foreground tracking-tight">
          Mentis
        </h1>
        <p className="max-w-md text-muted-foreground">
          Log in to the Card library.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
