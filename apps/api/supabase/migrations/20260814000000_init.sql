-- Applies to a freshly recreated `public` schema, which carries no default privileges — hence the
-- grants below with nothing to revoke beside them. The whole schema is born locked (system ADR
-- 0003): RLS on every table, zero policies, and every privilege held by `service_role` alone, so a
-- future object reaches the API only through an explicit grant.

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  type text not null
    check (type in ('quiz', 'true-false', 'anecdote', 'did-you-know', 'riddle')),
  title text not null check (length(trim(title)) > 0),
  tags text[] not null default '{}',
  payload jsonb not null default '{}'::jsonb,
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  posted_on text[] not null default '{}'
    check (
      posted_on <@ array['x', 'linkedin', 'facebook', 'tiktok', 'youtube', 'instagram']::text[]
    )
);

-- The list is always sorted by last update descending.
create index cards_updated_at_idx on public.cards (updated_at desc);

-- Posting is bookkeeping, not editing: only content changes bump updated_at, so flipping a Posted
-- mark never reorders the list.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if (new.type, new.title, new.tags, new.payload, new.images)
    is distinct from
    (old.type, old.title, old.tags, old.payload, old.images)
  then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

create trigger cards_set_updated_at
  before update on public.cards
  for each row
  execute function public.set_updated_at();

create table public.themes (
  id text primary key,
  name text not null
);

create table public.questions (
  id text primary key,
  theme_id text not null references public.themes (id) on delete cascade,
  text text not null,
  answer text not null,
  aliases text[] not null default '{}',
  misspellings text[] not null default '{}',
  wrong_choices text[] not null,
  constraint questions_exactly_3_wrong_choices check (cardinality(wrong_choices) = 3)
);

create index questions_theme_id_idx on public.questions (theme_id);

-- An RPC because PostgREST cannot express `order by random()`; a null Theme draws across every
-- Theme, so each row carries its own to stay attributable.
create function public.get_random_questions(theme_slug text default null, n integer default 10)
returns table (
  id text,
  theme_id text,
  theme_name text,
  text text,
  answer text,
  aliases text[],
  misspellings text[],
  wrong_choices text[]
)
language sql
security invoker
set search_path = ''
as $$
  select q.id, q.theme_id, t.name, q.text, q.answer, q.aliases, q.misspellings, q.wrong_choices
  from public.questions q
  join public.themes t on t.id = q.theme_id
  where theme_slug is null or q.theme_id = theme_slug
  order by random()
  limit n;
$$;

-- One append-only row per finished Quiz Session, keyed by a client-generated id so a retried push
-- upserts and never double-counts. Both player tables capture the Theme name at record time, so
-- replacing the hosted content leaves a Player's history intact.
create table public.quiz_sessions (
  id uuid primary key,
  owner uuid not null references auth.users (id) on delete cascade,
  theme_id text not null,
  theme_name text not null,
  points integer not null,
  finished_at timestamptz not null
);

create index quiz_sessions_owner_idx on public.quiz_sessions (owner);

-- Pre-account Device Stats moved in by a Stats Transfer, keyed so the transfer is
-- insert-if-absent per device.
create table public.stat_baselines (
  owner uuid not null references auth.users (id) on delete cascade,
  device uuid not null,
  theme_id text not null,
  theme_name text not null,
  total_points integer not null,
  session_count integer not null,
  primary key (owner, device, theme_id)
);

alter table public.cards enable row level security;
alter table public.themes enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.stat_baselines enable row level security;

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;

-- Routines are the one exception to born-grantless: Postgres grants `execute` to `PUBLIC` on every
-- new function by system default, and `anon` is a member of `PUBLIC`.
revoke execute on all functions in schema public from public;
grant execute on all functions in schema public to service_role;

-- Card Images live in a public-read bucket holding only processed webp files, written exclusively
-- through API-minted signed upload URLs (ADR 0001). Storage keeps its own RLS, untouched here.
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('card-images', 'card-images', true, '{image/webp}')
on conflict (id) do nothing;
