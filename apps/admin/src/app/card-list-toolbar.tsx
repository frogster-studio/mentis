"use client";

import { CARD_TYPES } from "@mentis/contracts/admin";
import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TypeDot } from "@/components/type-dot";
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
import { CARD_TYPE_LABELS } from "@/lib/cards/labels";

const SEARCH_DEBOUNCE_MS = 300;

// Radix Select items cannot carry an empty value, so "no filter" is a sentinel.
const ALL = "all";

// Every control reads from and writes to the URL, the list state's single home.
export function CardListToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The debounced search must see the params current at fire time, not the stale closure's.
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

  // An unknown value in a hand-edited URL falls back to "no filter", matching the server.
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
      <Select value={type} onValueChange={(value) => setParam("type", value === ALL ? "" : value)}>
        <SelectTrigger aria-label="Filter by Card Type">
          {/* "All Types" carries no dot, so the unfiltered trigger stays plain. */}
          {type !== ALL ? <TypeDot type={type} /> : null}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {/* A dot-wide spacer keeps "All Types" aligned with the dotted type items. */}
          <SelectItem value={ALL} leading={<span aria-hidden className="w-2.5 shrink-0" />}>
            All Types
          </SelectItem>
          {CARD_TYPES.map((cardType) => (
            <SelectItem key={cardType} value={cardType} leading={<TypeDot type={cardType} />}>
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
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
          <X />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
