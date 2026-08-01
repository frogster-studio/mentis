-- Theme content schema: drops the category-era quiz content tables and their
-- data (clean slate, pre-launch), then creates the theme-era schema — a themes
-- table, questions each owning exactly one Theme, a by-theme lookup index, RLS
-- granting the anonymous (publishable) key SELECT only, and the RPC returning
-- 10 random questions for a Theme (same contract as before, keyed by theme).
-- The pre-existing unrelated `cards` table is deliberately not touched.

-- Drop the category-era content, function first so the tables it depends on
-- (returns setof public.questions) can go.
drop function if exists public.get_random_questions(text);
drop table if exists public.question_categories;
drop table if exists public.questions;
drop table if exists public.categories;

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

alter table public.themes enable row level security;
alter table public.questions enable row level security;

create policy "anon can read themes"
  on public.themes for select to anon using (true);

create policy "anon can read questions"
  on public.questions for select to anon using (true);

-- 10 random questions belonging to the given Theme. Volatile (random()),
-- security invoker: anon reads through the SELECT policies above.
create function public.get_random_questions(theme_slug text)
returns setof public.questions
language sql
security invoker
set search_path = ''
as $$
  select q.*
  from public.questions q
  where q.theme_id = theme_slug
  order by random()
  limit 10;
$$;
