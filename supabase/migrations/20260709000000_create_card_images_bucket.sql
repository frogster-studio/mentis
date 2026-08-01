-- Card Images live in a public-read bucket holding only processed webp
-- files. The app writes exclusively through server-generated signed upload
-- URLs (ADR 0001); storage.objects keeps RLS on with no anon policies, so
-- unsigned writes are rejected.

insert into storage.buckets (id, name, public, allowed_mime_types)
values ('card-images', 'card-images', true, '{image/webp}')
on conflict (id) do nothing;
