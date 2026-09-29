import Image from "next/image";

import { APP_STORE_URL } from "./store-links";

export function AppStoreBadge({ className }: { className?: string }) {
  return (
    <a href={APP_STORE_URL} className={className}>
      <Image
        src="/mentis/app-store-badge.svg"
        alt="Télécharger dans l’App Store"
        width={152}
        height={48}
        unoptimized
      />
    </a>
  );
}
