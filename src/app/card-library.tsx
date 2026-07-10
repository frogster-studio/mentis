import { ChevronLeft, ChevronRight, LogOut, Plus } from "lucide-react";
import Link from "next/link";

import { CardListToolbar } from "@/app/card-list-toolbar";
import { CardRowLink } from "@/app/card-row-link";
import { CardSocials } from "@/app/card-socials";
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
  buildListHref,
  type CardListParams,
  parseListParams,
} from "@/lib/cards/list-params";
import { CARD_TYPE_LABELS, type Card } from "@/lib/cards/schema";
import { createServiceClient } from "@/lib/supabase";

const updatedAtFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

// Compact "5 min ago"-style age for the list, computed at render time (the
// page is force-dynamic). The exact timestamp stays available on hover.
function formatUpdatedAgo(iso: string): string {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000),
  );
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 31) return days === 1 ? "1 day ago" : `${days} days ago`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

// listParams is the list state parsed from the page's URL. Pages whose query
// params mean something else (/cards/new uses ?type= for the picker) omit it:
// they get the default view without the toolbar and page controls.
export async function CardLibrary({
  activeCardId,
  listParams,
}: {
  activeCardId?: string;
  listParams?: CardListParams;
}) {
  const params = listParams ?? parseListParams({});
  const { cards, page, pageCount } = await listCards(
    createServiceClient(),
    params,
  );
  const hasActiveFilters =
    params.search !== "" || params.type !== undefined || params.tag !== "";

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
        {listParams ? <CardListToolbar /> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Card Type</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Socials</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  {hasActiveFilters
                    ? "No Cards match the current search and filters."
                    : "No Cards yet. Use “New Card” to write the first one."}
                </TableCell>
              </TableRow>
            ) : (
              cards.map((card) => (
                <CardRow
                  key={card.id}
                  card={card}
                  active={card.id === activeCardId}
                  listParams={params}
                />
              ))
            )}
          </TableBody>
        </Table>
        {listParams && pageCount > 1 ? (
          <ListPagination
            basePath={activeCardId ? `/cards/${activeCardId}` : "/"}
            params={params}
            page={page}
            pageCount={pageCount}
          />
        ) : null}
      </main>
    </>
  );
}

function CardRow({
  card,
  active,
  listParams,
}: {
  card: Card;
  active: boolean;
  listParams: CardListParams;
}) {
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
            // stays clickable. The link keeps search and filters, composing
            // the Tag into the current view.
            <Badge
              key={tag}
              asChild
              variant="outline"
              className="relative z-10"
            >
              <Link href={buildListHref("/", listParams, { tag, page: 1 })}>
                {tag}
              </Link>
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <CardSocials cardId={card.id} postedOn={card.postedOn} />
      </TableCell>
      <TableCell
        className="text-muted-foreground/60"
        title={updatedAtFormatter.format(new Date(card.updatedAt))}
      >
        {formatUpdatedAgo(card.updatedAt)}
      </TableCell>
    </TableRow>
  );
}

function ListPagination({
  basePath,
  params,
  page,
  pageCount,
}: {
  basePath: string;
  params: CardListParams;
  page: number;
  pageCount: number;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-muted-foreground text-sm">
        Page {page} of {pageCount}
      </span>
      <PageButton
        label="Previous page"
        disabled={page <= 1}
        // A stale URL can point past the last page; Previous then returns
        // to the real last page instead of another empty one.
        href={buildListHref(basePath, params, {
          page: Math.min(page - 1, pageCount),
        })}
      >
        <ChevronLeft />
      </PageButton>
      <PageButton
        label="Next page"
        disabled={page >= pageCount}
        href={buildListHref(basePath, params, { page: page + 1 })}
      >
        <ChevronRight />
      </PageButton>
    </div>
  );
}

function PageButton({
  label,
  disabled,
  href,
  children,
}: {
  label: string;
  disabled: boolean;
  href: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="ghost" size="icon" aria-label={label}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
