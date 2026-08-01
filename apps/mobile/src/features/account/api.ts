import { useQuery } from "@tanstack/react-query";
import type { AccountSession, StatBaseline } from "@/features/quiz/account-stats";
import { ACCOUNT_QUERY_ROOT } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";

// A synced session carries its server id (the client-generated UUID) alongside the fold's input
// shape, so the optimistic overlay and the push's cache seed can reconcile by id: a row that is
// both still-pending and freshly pulled — or seeded by a race with a concurrent pull — is never
// counted more than once.
export type SyncedSession = AccountSession & { id: string };

// The Account world pulled from the two player tables, mapped into the fold's input shapes so the
// caller can hand it straight to foldAccountStats.
export type AccountWorld = {
  baselines: StatBaseline[];
  sessions: SyncedSession[];
};

// Keyed by owner so signing in — or switching to another Account on the same device — is a fresh
// cache entry: one Player's shelf never bleeds into another's. Built under ACCOUNT_QUERY_ROOT, the
// single marker the offline persister dehydrates (see lib/query-client).
export const accountKeys = {
  world: (owner: string) => [ACCOUNT_QUERY_ROOT, "world", owner] as const,
};

// PostgREST row shapes (the player tables' snake_case columns).
type BaselineRow = {
  theme_id: string;
  theme_name: string;
  total_points: number;
  session_count: number;
};

type SessionRow = {
  id: string;
  theme_id: string;
  theme_name: string;
  points: number;
};

async function fetchAccountWorld(owner: string): Promise<AccountWorld> {
  const [baselines, sessions] = await Promise.all([
    supabase
      .from("stat_baselines")
      .select("theme_id, theme_name, total_points, session_count")
      .eq("owner", owner),
    // Oldest-first, so the fold's last-name-wins yields the most recently captured Theme name.
    supabase
      .from("quiz_sessions")
      .select("id, theme_id, theme_name, points")
      .eq("owner", owner)
      .order("finished_at", { ascending: true }),
  ]);
  if (baselines.error) throw new Error(baselines.error.message);
  if (sessions.error) throw new Error(sessions.error.message);

  return {
    baselines: ((baselines.data ?? []) as BaselineRow[]).map((row) => ({
      themeId: row.theme_id,
      themeName: row.theme_name,
      totalPoints: row.total_points,
      sessionCount: row.session_count,
    })),
    sessions: ((sessions.data ?? []) as SessionRow[]).map((row) => ({
      id: row.id,
      themeId: row.theme_id,
      themeName: row.theme_name,
      points: row.points,
    })),
  };
}

// Pulls both player tables for the signed-in owner. Enabled only while signed in: the owner in the
// key makes React Query refetch at sign-in, refetchOnMount covers launch, and AppState foreground
// (wired in query-client) covers the foreground pull. When disabled, the world selector falls back
// to Device Stats.
export function useAccountWorld(owner: string | undefined) {
  return useQuery({
    queryKey: accountKeys.world(owner ?? ""),
    queryFn: () => fetchAccountWorld(owner as string),
    enabled: owner !== undefined,
  });
}
