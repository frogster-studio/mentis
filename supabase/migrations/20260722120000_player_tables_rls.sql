-- Player tables (the Account era foundation, per ADR 0002 direct-RLS access and
-- ADR 0003 append-only sync): the two owner-scoped tables that carry a Player's
-- history across devices. Neither references the content tables — the seed
-- pipeline replaces hosted Themes, so both capture the Theme name at record time
-- and survive that replacement.
--
--   quiz_sessions  — one append-only row per finished Quiz Session, keyed by a
--                    client-generated UUID so a retried push upserts on the key
--                    and never double-counts. Cascades away with its owner.
--   stat_baselines — one row per (owner, device, Theme) holding the pre-account
--                    Device Stats totals moved in by a Stats Transfer, keyed so
--                    the transfer is insert-if-absent (idempotent) per device.
--
-- RLS: owner-only insert and select on both tables; no update or delete policies
-- exist (the data is append-only and account deletion cascades server-side). The
-- anonymous (publishable) key matches no policy and is therefore blocked on both
-- tables for both read and write. The pre-existing content and cards tables are
-- deliberately not touched.

create table public.quiz_sessions (
  id uuid primary key,
  owner uuid not null references auth.users (id) on delete cascade,
  theme_id text not null,
  theme_name text not null,
  points integer not null,
  finished_at timestamptz not null
);

create index quiz_sessions_owner_idx on public.quiz_sessions (owner);

create table public.stat_baselines (
  owner uuid not null references auth.users (id) on delete cascade,
  device uuid not null,
  theme_id text not null,
  theme_name text not null,
  total_points integer not null,
  session_count integer not null,
  primary key (owner, device, theme_id)
);

alter table public.quiz_sessions enable row level security;
alter table public.stat_baselines enable row level security;

-- Owner-scoped to the authenticated role via auth.uid(). No update or delete
-- policy exists, so those commands are denied for everyone — the data is
-- append-only and rows leave only by cascade from auth.users.
create policy "owner reads own sessions"
  on public.quiz_sessions for select to authenticated using (auth.uid() = owner);

create policy "owner inserts own sessions"
  on public.quiz_sessions for insert to authenticated with check (auth.uid() = owner);

create policy "owner reads own baselines"
  on public.stat_baselines for select to authenticated using (auth.uid() = owner);

create policy "owner inserts own baselines"
  on public.stat_baselines for insert to authenticated with check (auth.uid() = owner);
