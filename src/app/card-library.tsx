import { LogOut, Plus } from "lucide-react";
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
} from "@/lib/cards/schema";
import { createServiceClient } from "@/lib/supabase";

const updatedAtFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

export async function CardLibrary({ activeCardId }: { activeCardId?: string }) {
  const cards = await listCards(createServiceClient());

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Card Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No Cards yet. Use “New Card” to write the first one.
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
