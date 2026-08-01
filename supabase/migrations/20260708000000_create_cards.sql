-- The single cards table. Shared columns are final from this migration on:
-- later Card Types only add members to the payload union, never columns.

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  type text not null
    check (type in ('quiz', 'true-false', 'anecdote', 'did-you-know', 'riddle')),
  title text not null check (length(trim(title)) > 0),
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  payload jsonb not null default '{}'::jsonb,
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The list is always sorted by last update descending.
create index cards_updated_at_idx on public.cards (updated_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cards_set_updated_at
  before update on public.cards
  for each row
  execute function public.set_updated_at();

-- All access goes through the server with the service-role key (which
-- bypasses RLS). Enabling RLS with no policies shuts out the anon key.
alter table public.cards enable row level security;
