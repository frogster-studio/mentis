# The database admits only the API

`apps/api`, connecting as `service_role` through its `sb_secret_*` key, is the only reader and writer of the project's data. The `public` schema carries three independent locks: row-level security enabled on every table, zero policies, and zero privileges for `anon` and `authenticated` — no table, sequence, or routine grants, no schema `usage`, and default privileges altered so every future object is born grantless. Routines execute for `service_role` alone. The publishable key and any player JWT reach Supabase Auth and nothing else — sign-in, refresh, and JWKS live on a separate plane the revokes never touch. Account deletion is the API calling `auth.admin.deleteUser` with the guard-verified user id, the FK cascade from `auth.users` erasing the player tables; no security-definer function exists. Storage keeps its shape per [ADR 0001](0001-storage-bytes-never-transit-the-api.md): public CDN reads, API-minted signed-upload tokens, `storage.objects` with RLS on and no policies.

We rejected keeping owner-scoped RLS policies as defense-in-depth: the API bypasses RLS, so retained policies protect no API request — their only live effect would be holding a direct-PostgREST door open for player JWTs to write forged rows around the API's contract validation. Real depth is independent locks on the same deny, not a second authorization model kept half-alive.

## Consequences

- Every future table or function is born inaccessible from outside: a forgotten grant or missing policy fails closed, and re-opening direct access requires defeating all three locks at once.
- Score integrity rests entirely on the API's validation — no client-writable path to the player tables exists. Supersedes the [mobile context's supabase-only-backend ADR](../../apps/mobile/docs/adr/0002-supabase-only-backend.md) wholly, including its accepted forged-rows caveat and its edge-function fallback.
- The whole end-state is encoded in one migration, `lock_database_to_api_gateway`, applied immediately after the mobile cutover — the moment the last direct consumer disappears.
- pg_graphql resolves against SQL privileges, so the auto-exposed GraphQL endpoint goes inert with no separate switch.
