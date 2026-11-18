"use client";

import type { AdminAnecdoteResponse } from "@mentis/contracts/admin";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { AppHeader } from "@/components/app-header";
import { useReportUnsavedChanges } from "@/components/workspace-shell";
import { useAnecdotes } from "../api";
import { searchAnecdotes } from "../search-anecdotes";
import { AnecdoteForm } from "./anecdote-form";
import { AnecdoteText } from "./anecdote-text";
import { Column } from "./column";
import { CONTROL } from "./control";
import { Row } from "./row";
import { useSearchShortcut } from "./use-search-shortcut";

const QUERY_PARAM = "q";
const ANECDOTE_PARAM = "anecdote";

// The search and the selection share the query string, so each write keeps the other's param.
const urlWithParam = (name: string, value: string | null): string => {
  const params = new URLSearchParams(window.location.search);
  if (value === null || value === "") params.delete(name);
  else params.set(name, value);
  const serialized = params.toString();
  return `${window.location.pathname}${serialized === "" ? "" : `?${serialized}`}`;
};

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

export const AnecdotesWorkspace = () => {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get(QUERY_PARAM) ?? "");
  const [selectedId, setSelectedId] = useState(searchParams.get(ANECDOTE_PARAM));
  const [isCreating, setIsCreating] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  useReportUnsavedChanges(isFormDirty);
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
    window.history.replaceState(null, "", urlWithParam(QUERY_PARAM, next));
  };

  const select = (anecdoteId: string | null) => {
    setSelectedId(anecdoteId);
    window.history.replaceState(null, "", urlWithParam(ANECDOTE_PARAM, anecdoteId));
  };

  const mayLeaveForm = (): boolean =>
    !isFormDirty || window.confirm("This form has unsaved changes. Leave anyway?");

  const selectAnecdote = (anecdoteId: string) => {
    if (!mayLeaveForm()) return;

    setIsCreating(false);
    select(anecdoteId);
  };

  const startCreating = () => {
    if (!mayLeaveForm()) return;

    setIsCreating(true);
    select(null);
  };

  const onSaved = (saved: AdminAnecdoteResponse) => {
    setIsFormDirty(false);
    setIsCreating(false);
    select(saved.id);
  };

  const selectedAnecdote = anecdotes.data?.find(({ id }) => id === selectedId);

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
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(20rem,1fr)] divide-x divide-zinc-200">
          <Column
            title={
              anecdotes.data === undefined
                ? "Anecdotes"
                : `Anecdotes · ${isSearching ? `${found.length} / ${total}` : total}`
            }
            isLoading={anecdotes.isPending}
            isEmpty={found.length === 0}
            emptyLabel={total === 0 ? "No Anecdote yet." : "No Anecdote matches this search."}
            create={{ label: "New Anecdote", onSelect: startCreating }}
          >
            {found.map(({ anecdote, textHighlights }) => (
              <Row
                key={anecdote.id}
                isSelected={anecdote.id === selectedId}
                onSelect={() => selectAnecdote(anecdote.id)}
                scrollsIntoView={anecdote.id === selectedId}
              >
                <AnecdoteThumbnail imageUrl={anecdote.imageUrl} />
                <span className="min-w-0 flex-1">
                  <AnecdoteText text={anecdote.text} highlights={textHighlights} />
                </span>
              </Row>
            ))}
          </Column>

          <Column
            title="Details"
            isEmpty={!isCreating && selectedAnecdote === undefined}
            emptyLabel="Select an Anecdote to see it here."
          >
            <div className="flex flex-col gap-5 p-4">
              <AnecdoteForm
                key={isCreating ? "new-anecdote" : selectedAnecdote?.id}
                anecdote={isCreating ? undefined : selectedAnecdote}
                onDirtyChange={setIsFormDirty}
                onSaved={onSaved}
              />
            </div>
          </Column>
        </div>
      </main>
    </>
  );
};
