import { appAnecdoteDrawResponseSchema } from "@mentis/contracts/app";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { parisDay } from "@/features/account/streak";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { ANECDOTE_COUNT } from "./constants";
import { type Anecdote, type AnecdoteDaySet, buildDaySet, isDrawDue } from "./day-set";
import { useAnecdoteStore } from "./store";

const anecdoteKeys = {
  root: ["anecdote"] as const,
  daySet: (day: string) => ["anecdote", "day-set", day] as const,
};

function fetchAnecdotes(): Promise<Anecdote[]> {
  return api.requestJson(
    { method: "GET", path: "/app/anecdotes", query: { n: String(ANECDOTE_COUNT) } },
    appAnecdoteDrawResponseSchema,
  );
}

async function drawDaySet(now: Date): Promise<AnecdoteDaySet> {
  const daySet = buildDaySet(await fetchAnecdotes(), now);
  useAnecdoteStore.getState().land(daySet);
  return daySet;
}

function useNowRereadOnFocusAndForeground(): Date {
  const [now, setNow] = useState(() => new Date());
  const reread = useCallback(() => {
    const current = new Date();
    setNow(current);
    void queryClient.refetchQueries(
      { queryKey: anecdoteKeys.daySet(parisDay(current)), type: "active" },
      { cancelRefetch: false },
    );
  }, []);
  useFocusEffect(reread);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        reread();
      }
    });
    return () => subscription.remove();
  }, [reread]);
  return now;
}

export function resetAnecdoteDaySet() {
  queryClient.removeQueries({ queryKey: anecdoteKeys.root });
  useAnecdoteStore.setState({ daySet: null });
}

export function useAnecdoteDaySet() {
  const now = useNowRereadOnFocusAndForeground();
  const hasHydrated = useAnecdoteStore((state) => state.hasHydrated);
  const storedDaySet = useAnecdoteStore((state) => state.daySet);
  const daySet = isDrawDue(storedDaySet, now) ? null : storedDaySet;
  const draw = useQuery({
    queryKey: anecdoteKeys.daySet(parisDay(now)),
    queryFn: () => drawDaySet(now),
    enabled: hasHydrated && daySet === null,
    // The reread retries a failed draw on today's key alone, never on a past day's.
    refetchOnWindowFocus: false,
  });
  return { daySet, isPending: !hasHydrated || (daySet === null && draw.isPending) };
}
