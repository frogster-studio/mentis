"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARD_TYPE_LABELS, CARD_TYPES } from "@/lib/cards/schema";

const SEARCH_DEBOUNCE_MS = 300;

// Radix Select items cannot carry an empty value, so "no filter" is a
// sentinel.
const ALL = "all";

// Search, the Type filter, the active Tag, and clear-all. Every control
// reads from and writes to the URL, which is the list state's single home.
export function CardListToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The debounced search must fire against the params current at that
  // moment — a filter changed while the debounce was pending would otherwise
  // be dropped by the stale closure.
  const paramsRef = useRef(searchParams);
  paramsRef.current = searchParams;

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(paramsRef.current);
    if (value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // A changed search or filter starts back on the first page.
    params.delete("page");
    const query = params.toString();
    router.replace(query === "" ? pathname : `${pathname}?${query}`);
  }

  function onSearchChange(value: string) {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setParam("q", value.trim());
    }, SEARCH_DEBOUNCE_MS);
  }

  function clearAll() {
    clearTimeout(debounceRef.current);
    setSearch("");
    router.replace(pathname);
  }

  // An unknown value in a hand-edited URL falls back to "no filter", the
  // same way the server ignores it.
  const type = CARD_TYPES.find((t) => t === searchParams.get("type")) ?? ALL;
  const tag = searchParams.get("tag") ?? "";
  const hasActiveFilters = search !== "" || type !== ALL || tag !== "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by Title…"
        aria-label="Search by Title"
        className="w-64"
      />
      <Select
        value={type}
        onValueChange={(value) => setParam("type", value === ALL ? "" : value)}
      >
        <SelectTrigger aria-label="Filter by Card Type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Types</SelectItem>
          {CARD_TYPES.map((cardType) => (
            <SelectItem key={cardType} value={cardType}>
              {CARD_TYPE_LABELS[cardType]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {tag !== "" ? (
        <div className="flex items-center gap-1">
          <Badge variant="secondary">{tag}</Badge>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Clear Tag filter"
            onClick={() => setParam("tag", "")}
          >
            <X />
          </Button>
        </div>
      ) : null}
      {hasActiveFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-muted-foreground"
        >
          <X />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
