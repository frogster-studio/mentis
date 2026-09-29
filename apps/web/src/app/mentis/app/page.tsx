import type { Metadata } from "next";

import { AppStoreBadge } from "@/features/mentis/app-store-badge";
import { ANDROID_BETA_URL } from "@/features/mentis/store-links";
import { StoreRedirect } from "@/features/mentis/store-redirect";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Télécharger Mentis",
  robots: { index: false },
};

export default function AppPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-24">
      <StoreRedirect />
      <h1 className="text-4xl">Télécharger Mentis</h1>
      <p className="text-lg text-zinc-600">Redirection vers la bonne boutique…</p>
      <AppStoreBadge className="self-start" />
      <p className="text-sm text-zinc-600">
        Sur Android ?{" "}
        <a href={ANDROID_BETA_URL} className="text-sky-600 hover:underline">
          Rejoins la bêta
        </a>
        . Sinon,{" "}
        <a href={ROUTES.mentis} className="text-sky-600 hover:underline">
          découvre Mentis
        </a>
        .
      </p>
    </main>
  );
}
