import { ChevronLeft, ChevronRight, LogOut, Plus } from "lucide-react";
import Link from "next/link";

import { CardListToolbar } from "@/app/card-list-toolbar";
import { CardRowLink } from "@/app/card-row-link";
import { CardSocials } from "@/app/card-socials";
import { MentisLogo } from "@/components/mentis-logo";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { logout } from "@/lib/auth/actions";
import { listCards } from "@/lib/cards/data";
import {
  buildListHref,
  type CardListParams,
  parseListParams,
} from "@/lib/cards/list-params";
import { CARD_TYPE_LABELS, type Card, type CardType } from "@/lib/cards/schema";
import { createServiceClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

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
      {/* 3-column grid keeps the New Card action dead-center regardless of
          how wide the logo and session controls are (docs/ui-conventions.md,
          App chrome). z-40 stays below the sheets' z-50 overlay. */}
      <header className="sticky top-0 z-40 grid h-14 grid-cols-[1fr_auto_1fr] items-center border-border border-b bg-background/80 px-6 backdrop-blur">
        <Link
          href="/"
          aria-label="Mentis — Card library"
          className="justify-self-start rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <MentisLogo className="h-7 w-auto" />
        </Link>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              size="icon"
              className="size-10 bg-sky-100 text-sky-600 hover:bg-primary hover:text-primary-foreground"
            >
              <Link href="/cards/new" aria-label="New Card">
                <Plus className="size-5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Card</TooltipContent>
        </Tooltip>
        <form action={logout} className="justify-self-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="Log out"
                className="size-10 text-muted-foreground"
              >
                <LogOut className="size-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Log out</TooltipContent>
          </Tooltip>
        </form>
      </header>
      {/* Canvas + surface (docs/ui-conventions.md, Surfaces): the tinted
          canvas is scoped to the library so the login page keeps its own
          background; only the header spans the viewport. */}
      <main className="flex-1 bg-zinc-50 p-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          <h1 className="font-semibold text-2xl text-foreground tracking-tight">
            Cards
          </h1>
          {listParams ? <CardListToolbar /> : null}
          <div className="overflow-hidden rounded-lg border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                  <TableHead className="pl-4 text-muted-foreground text-xs">
                    Title
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Card Type
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Tags
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Socials
                  </TableHead>
                  <TableHead className="pr-4 text-muted-foreground text-xs">
                    Updated
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
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
          </div>
          {listParams && pageCount > 1 ? (
            <ListPagination
              basePath={activeCardId ? `/cards/${activeCardId}` : "/"}
              params={params}
              page={page}
              pageCount={pageCount}
            />
          ) : null}
        </div>
      </main>
    </>
  );
}

// Underline mark per Card Type (docs/ui-conventions.md, Card Type colors).
// Written out as literal classes so Tailwind's scanner generates them.
const CARD_TYPE_UNDERLINE: Record<CardType, string> = {
  quiz: "border-type-quiz",
  "true-false": "border-type-true-false",
  anecdote: "border-type-anecdote",
  "did-you-know": "border-type-did-you-know",
  riddle: "border-type-riddle",
};

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
      <TableCell className="py-2.5 pl-4 font-medium">
        <CardRowLink cardId={card.id}>{card.title}</CardRowLink>
      </TableCell>
      <TableCell className="py-2.5">
        <span
          className={cn(
            "inline-block whitespace-nowrap border-b-[3px] pb-0.5",
            CARD_TYPE_UNDERLINE[card.type],
          )}
        >
          {CARD_TYPE_LABELS[card.type]}
        </span>
      </TableCell>
      <TableCell className="py-2.5">
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
      <TableCell className="py-2.5">
        <CardSocials cardId={card.id} postedOn={card.postedOn} />
      </TableCell>
      <TableCell
        className="py-2.5 pr-4 text-muted-foreground/60"
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
