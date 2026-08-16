"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type * as React from "react";

// Carries the query params onto the Card URL so closing the sheet restores the exact list view.
export function CardRowLink({ cardId, children }: { cardId: string; children: React.ReactNode }) {
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
