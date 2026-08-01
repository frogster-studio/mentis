-- Account deletion (App Store guideline 5.1.1(v), and the GDPR erasure path): a
-- security-definer function that deletes the *calling* auth user. Both player
-- tables carry `owner ... references auth.users (id) on delete cascade` (see the
-- player-tables migration), so removing the auth row erases the whole Account in
-- one statement — every quiz_sessions and stat_baselines row follows by cascade.
--
-- Owner-only by construction: the body is hard-wired to auth.uid() (there is no
-- parameter), so an authenticated caller can only ever delete themselves, never
-- another Account. security definer lets it reach auth.users (the caller's own
-- role cannot); `set search_path = ''` pins every reference to its schema so the
-- elevated body cannot be redirected. This is ADR 0002's primary path; the edge
-- function is the sanctioned fallback only if this proves unworkable at deploy.

create function public.delete_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

-- Callable only by a signed-in user. Postgres grants EXECUTE to PUBLIC on every
-- new function, so revoke that first (anon is a member of public and loses it too),
-- then grant it to the authenticated role alone — an anon caller has no auth.uid()
-- and no execute grant, so it is blocked twice over.
revoke execute on function public.delete_account() from public;
grant execute on function public.delete_account() to authenticated;
