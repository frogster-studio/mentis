-- Posted-on-Social bookkeeping replaces the Draft/Published status (ADR 0002).
-- Dropping the column loses the stored statuses for good — that is intended.

alter table public.cards drop column status;

alter table public.cards add column posted_on text[] not null default '{}'
  check (
    posted_on <@ array['x', 'linkedin', 'facebook', 'tiktok', 'youtube', 'instagram']::text[]
  );

-- Posting is bookkeeping, not editing: only content changes bump updated_at,
-- so flipping a Posted mark never reorders the list.
create or replace function public.set_updated_at()
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
