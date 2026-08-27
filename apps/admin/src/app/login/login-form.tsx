"use client";

import { useActionState } from "react";

import { login } from "@/lib/auth/actions";

const inputClasses =
  "h-10 rounded-lg border border-zinc-200 px-3 text-sm outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction, pending] = useActionState(login, undefined);
  const error = state?.error ?? notice;

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="font-medium text-sm text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClasses}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="font-medium text-sm text-zinc-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClasses}
        />
      </div>
      {error ? (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-lg bg-sky-600 font-medium text-sm text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
      >
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
