-- Generalizes the question draw for the `/app/questions` contract: the Theme
-- becomes optional (null draws across every Theme) and the row count becomes a
-- parameter — neither is expressible through PostgREST, which cannot write
-- `order by random()`. Each row now carries its Theme so a cross-theme draw
-- stays attributable. The name and the leading `theme_slug` parameter are kept
-- so mobile's current call keeps working until its cutover.

drop function if exists public.get_random_questions(text);

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
