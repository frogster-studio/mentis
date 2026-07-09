import { LogOut, Plus, X } from "lucide-react";
import Link from "next/link";

import { CardRowLink } from "@/app/card-row-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logout } from "@/lib/auth/actions";
import { listCards } from "@/lib/cards/data";
import {
  CARD_STATUS_LABELS,
  CARD_TYPE_LABELS,
  type Card,
  normalizeTag,
} from "@/lib/cards/schema";
import { createServiceClient } from "@/lib/supabase";

const updatedAtFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

export async function CardLibrary({
  activeCardId,
  filterTag,
}: {
  activeCardId?: string;
  filterTag?: string;
}) {
  const activeTag = normalizeTag(filterTag ?? "");
  const cards = await listCards(createServiceClient(), { tag: activeTag });

  return (
    <>
      <header className="flex items-center justify-between border-border border-b px-6 py-3">
        <span className="font-semibold text-foreground">Mentis</span>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/cards/new">
              <Plus />
              New Card
            </Link>
          </Button>
          <form action={logout}>
            <Button type="submit" variant="ghost">
              <LogOut />
              Log out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="font-semibold text-2xl text-foreground tracking-tight">
          Cards
        </h1>
        {activeTag !== "" ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>Filtered by Tag</span>
            <Badge variant="secondary">{activeTag}</Badge>
            <Button
              asChild
              variant="ghost"
              size="icon-xs"
              aria-label="Clear Tag filter"
            >
              <Link href="/">
                <X />
              </Link>
            </Button>
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Card Type</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  {activeTag !== ""
                    ? "No Cards carry this Tag."
                    : "No Cards yet. Use “New Card” to write the first one."}
                </TableCell>
              </TableRow>
            ) : (
              cards.map((card) => (
                <CardRow
                  key={card.id}
                  card={card}
                  active={card.id === activeCardId}
                />
              ))
            )}
          </TableBody>
        </Table>
      </main>
    </>
  );
}

function CardRow({ card, active }: { card: Card; active: boolean }) {
  return (
    <TableRow className="relative" data-state={active ? "selected" : undefined}>
      <TableCell className="font-medium">
        <CardRowLink cardId={card.id}>{card.title}</CardRowLink>
      </TableCell>
      <TableCell>{CARD_TYPE_LABELS[card.type]}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {card.tags.map((tag) => (
            // z-10 lifts the chip above the row-covering link overlay so it
            // stays clickable.
            <Badge
              key={tag}
              asChild
              variant="outline"
              className="relative z-10"
            >
              <Link href={`/?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={card.status === "published" ? "default" : "secondary"}>
          {CARD_STATUS_LABELS[card.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {updatedAtFormatter.format(new Date(card.updatedAt))}
      </TableCell>
    </TableRow>
  );
}
