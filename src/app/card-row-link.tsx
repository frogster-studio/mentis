"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type * as React from "react";

// Carries the current query params onto the Card URL so that closing the
// sidebar can restore the exact list view (search, filters) it came from.
export function CardRowLink({
  cardId,
  children,
}: {
  cardId: string;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <Link
      href={`/cards/${cardId}${query ? `?${query}` : ""}`}
      className="after:absolute after:inset-0"
    >
      {children}
    </Link>
  );
}
