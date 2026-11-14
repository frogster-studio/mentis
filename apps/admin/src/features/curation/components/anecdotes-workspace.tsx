"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { AppHeader } from "@/components/app-header";
import { anecdoteSegments } from "../anecdote-segments";
import { useAnecdotes } from "../api";
import { searchAnecdotes } from "../search-anecdotes";
import type { Highlight } from "../search-catalog";
import { Column } from "./column";
import { CONTROL } from "./control";
import { useSearchShortcut } from "./use-search-shortcut";

const QUERY_PARAM = "q";

const THUMBNAIL = "aspect-[750/1024] h-12 w-auto shrink-0 rounded-lg";

const AnecdoteThumbnail = ({ imageUrl }: { imageUrl: string | null }) => {
  if (imageUrl === null) {
    return (
      <span
        role="img"
        title="No image"
        aria-label="No image"
        className={`${THUMBNAIL} border border-zinc-300 border-dashed`}
      />
    );
  }
  // The file is fetched as stored and only once its row nears the viewport.
  return (
    <Image
      src={imageUrl}
      alt="Anecdote Image"
      width={750}
      height={1024}
      loading="lazy"
      unoptimized
      className={`${THUMBNAIL} bg-zinc-100 object-cover`}
    />
  );
};

const AnecdoteText = ({ text, highlights }: { text: string; highlights: Highlight[] }) => {
  let offset = 0;
  return anecdoteSegments(text, highlights).map((segment) => {
    const key = offset;
    offset += segment.text.length;
    return (
      <span
        key={key}
        className={`${segment.isBold ? "font-bold" : ""} ${segment.isItalic ? "italic" : ""} ${
          segment.isFound ? "bg-sky-100 text-sky-700" : ""
        }`}
      >
        {segment.text}
      </span>
    );
  });
};

export const AnecdotesWorkspace = () => {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get(QUERY_PARAM) ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const anecdotes = useAnecdotes();
  useSearchShortcut(inputRef);

  const found = useMemo(
    () => searchAnecdotes(query, anecdotes.data ?? []),
    [query, anecdotes.data],
  );

  // The query lives in the URL too, so a refresh or a return to this workspace keeps the search.
  const search = (next: string) => {
    setQuery(next);
    const queryString = next === "" ? "" : `?${new URLSearchParams({ [QUERY_PARAM]: next })}`;
    window.history.replaceState(null, "", `${window.location.pathname}${queryString}`);
  };

  const total = anecdotes.data?.length ?? 0;
  const isSearching = found.length !== total;

  return (
    <>
      <AppHeader
        center={
          <div className="w-96">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => search(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") search("");
              }}
              placeholder="Search the Anecdotes"
              aria-label="Search the Anecdotes"
              className={CONTROL}
            />
          </div>
        }
      />
      <main className="flex min-h-0 w-full flex-1 flex-col">
        {anecdotes.error ? (
          <p
            role="alert"
            className="shrink-0 border-red-200 border-b bg-red-50 px-6 py-2 text-red-700 text-sm"
          >
            {anecdotes.error.message}
          </p>
        ) : null}
        <div className="grid min-h-0 flex-1">
          <Column
            title={
              anecdotes.data === undefined
                ? "Anecdotes"
                : `Anecdotes · ${isSearching ? `${found.length} / ${total}` : total}`
            }
            isLoading={anecdotes.isPending}
            isEmpty={found.length === 0}
            emptyLabel={total === 0 ? "No Anecdote yet." : "No Anecdote matches this search."}
          >
            <ul>
              {found.map(({ anecdote, textHighlights }) => (
                <li
                  key={anecdote.id}
                  className="flex items-center gap-4 border-zinc-100 border-b px-4 py-2.5 text-sm transition-colors last:border-b-0 hover:bg-zinc-50"
                >
                  <AnecdoteThumbnail imageUrl={anecdote.imageUrl} />
                  <p className="min-w-0 flex-1">
                    <AnecdoteText text={anecdote.text} highlights={textHighlights} />
                  </p>
                </li>
              ))}
            </ul>
          </Column>
        </div>
      </main>
    </>
  );
};
