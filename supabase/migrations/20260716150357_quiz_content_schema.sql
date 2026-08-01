-- Quiz content schema: categories, questions, question↔category junction,
-- RLS granting the anonymous (publishable) key SELECT only, and the RPC
-- returning 10 random questions for a category.
-- The pre-existing unrelated `cards` table is deliberately not touched.

create table public.categories (
  id text primary key,
  name text not null
);

create table public.questions (
  id text primary key,
  text text not null,
  answer text not null,
  aliases text[] not null default '{}',
  misspellings text[] not null default '{}',
  wrong_choices text[] not null,
  constraint questions_exactly_3_wrong_choices check (cardinality(wrong_choices) = 3)
);

create table public.question_categories (
  question_id text not null references public.questions (id) on delete cascade,
  category_id text not null references public.categories (id) on delete cascade,
  primary key (question_id, category_id)
);

create index question_categories_category_id_idx
  on public.question_categories (category_id);

alter table public.categories enable row level security;
alter table public.questions enable row level security;
alter table public.question_categories enable row level security;

create policy "anon can read categories"
  on public.categories for select to anon using (true);

create policy "anon can read questions"
  on public.questions for select to anon using (true);

create policy "anon can read question_categories"
  on public.question_categories for select to anon using (true);

-- 10 random questions linked to the given category. Volatile (random()),
-- security invoker: anon reads through the SELECT policies above.
create function public.get_random_questions(category_slug text)
returns setof public.questions
language sql
security invoker
set search_path = ''
as $$
  select q.*
  from public.questions q
  join public.question_categories qc on qc.question_id = q.id
  where qc.category_id = category_slug
  order by random()
  limit 10;
$$;
