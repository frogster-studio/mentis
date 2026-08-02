# Research: how apps/api verifies Supabase Auth JWTs

Resolves [#4](https://github.com/frogster-studio/mentis/issues/4) (part of the wayfinder map #2).
Researched 2026-08-02 against supabase.com/docs (primary sources listed at the bottom).

## TL;DR recommendation

1. **Finish the two pending Supabase migrations first** (both are dashboard-driven and independent):
   the **JWT signing keys** migration (legacy HS256 secret → asymmetric ES256 key) and the
   **API keys** migration (`anon`/`service_role` → `sb_publishable_*`/`sb_secret_*`). Doing them
   now — before `apps/api` exists and before any mobile binary ships via EAS — makes both nearly
   free. Legacy keys are deleted by Supabase in late 2026 anyway.
2. **Verify JWTs locally in a NestJS guard with `jose`** against the project JWKS endpoint —
   no network hop per request, no supabase-js dependency in the guard. `auth.getClaims()` is the
   fallback only while user tokens are still HS256-signed.
3. Trust only verified claims: require `role === "authenticated"`, `aud === "authenticated"`,
   use `sub` as the user id. Never accept a bare "valid signature" — the legacy `anon` key itself
   is a validly signed JWT.
4. `apps/api` holds exactly two Supabase env values: `SUPABASE_URL` and one `sb_secret_*` key for
   its service client. The legacy JWT secret is never copied anywhere.

## 1. Asymmetric signing keys + JWKS vs the legacy JWT secret

Supabase now has two JWT-signing regimes:

- **Legacy (what this project still runs):** one symmetric **HS256 shared secret** signs
  everything — user access tokens *and* the `anon`/`service_role` API keys. Verifying tokens
  yourself requires possessing the secret (any leak = attacker can forge any user or
  `service_role` token), and the docs explicitly warn against verifying HS256 tokens with the
  shared secret yourself; rotation forces downtime/logouts.
- **Current (recommended for anything new):** the **JWT signing keys** system with asymmetric
  algorithms — **ES256** (recommended), RS256, Ed25519 announced. Public keys are served at:

  ```
  https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
  ```

  Anyone can verify tokens locally; nobody outside Supabase Auth can mint them (private key is
  not extractable). Rotation is zero-downtime via a **standby key**: the standby key is
  advertised in the JWKS before it signs anything, so caches are warm when you rotate.

**Migration path for this project (still on the legacy secret):**

1. Dashboard → JWT signing keys → **Migrate JWT secret** (imports the legacy secret into the new
   system, creates an ES256 standby key).
2. Ensure nothing verifies JWTs against the raw legacy secret (nothing in this repo does) and no
   Edge Functions rely on `verify_jwt` (we have none).
3. **Rotate keys** → new tokens are ES256; existing HS256 tokens stay valid until expiry.
4. After at least one access-token lifetime (default 1 h; docs say wait ≥ 1 h 15 min), **revoke**
   the legacy secret — allowed only after the legacy `anon`/`service_role` API keys are disabled,
   because those keys are themselves JWTs signed by that secret (see §4).

JWKS revocation caveat: edge + client caches mean a *revoked signing key* can still be accepted
by third-party verifiers for up to ~20 minutes; Supabase products themselves revoke instantly.

## 2. Verification options inside the Nest guard

| | `supabase.auth.getClaims(token)` | local `jose` + JWKS |
|---|---|---|
| Network per request | none with asymmetric keys (cached JWKS); **every call hits the Auth server while keys are HS256** | none (JWKS fetched once, cached in-process, refetched on unknown `kid`) |
| Works on legacy HS256 | yes (delegates to Auth server, like `getUser()`) | no — symmetric secrets can't be published in JWKS |
| Dependencies | supabase-js client in the guard | `jose` only; guard stays framework-pure |
| Revocation | same as local (JWT-based) unless you use `getUser()`, which checks the Auth server every call | none until `exp` (see §3) |
| Control over checks | fixed | explicit `issuer`/`audience`/algorithm pinning |

Docs prefer `getClaims()` over `getUser()` for performance, and for external verifiers they show
exactly the `jose` pattern: `createRemoteJWKSet()` + `jwtVerify()`. For a dedicated API that will
be the sole DB gateway, **local `jose` verification is the recommended end state**: fastest,
no supabase-js coupling in the auth layer, explicit claim checks. Sequencing:

- **Before the signing-key rotation:** guard calls `getClaims()` (one Auth-server round-trip per
  request — acceptable short-term, and another reason to rotate before building `apps/api`).
- **After rotation to ES256:** guard verifies locally with `jose`.

### Guard sketch (end state)

```ts
// apps/api/src/auth/supabase-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) throw new UnauthorizedException("missing bearer token");

    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `${process.env.SUPABASE_URL}/auth/v1`,
        audience: "authenticated", // rejects tokens minted for anything else
      });
      // Signature alone is NOT auth: the legacy anon key is a validly signed JWT (role "anon").
      if (payload.role !== "authenticated" || typeof payload.sub !== "string") {
        throw new UnauthorizedException("not an authenticated user token");
      }
      request.user = { id: payload.sub, claims: payload };
      return true;
    } catch {
      throw new UnauthorizedException("invalid or expired token");
    }
  }
}
```

The mobile app sends its Supabase session `access_token` as `Authorization: Bearer <token>` on
every call; supabase-js on the device auto-refreshes it. The API stays stateless: it never mints,
refreshes, or stores tokens — an expired token is a plain 401 and the client retries after
supabase-js refreshes.

## 3. Claims to trust, and pitfalls

From the JWT-fields reference, on a verified token:

- **`sub`** — the user UUID; the only user identifier the API should use.
- **`role`** — Postgres role: `anon`, `authenticated`, or `service_role`. Require
  `authenticated`. This is a Postgres/RLS role, **not** an app permission system — app-level
  roles belong in our own tables keyed by `sub`.
- **`aud`** — `authenticated` for logged-in users; pass it to `jwtVerify` as `audience`.
- **`exp` / `iss`** — enforced by `jwtVerify` options; pin `iss` to our project URL.
- Useful extras: `is_anonymous` (reject if we never enable anonymous sign-in), `session_id`,
  `email`. **`user_metadata` is user-editable — never make authorization decisions on it.**

Pitfalls:

- **The anon-key-as-bearer trap.** Under the legacy regime the public `anon` key is itself a
  JWT signed by the same secret as user tokens. A guard that only checks "signature valid" lets
  anyone in with the published anon key. The `role`/`aud` checks above close this. (A compromised
  anon key still can't *forge* user tokens — only the JWT secret / signing key can — which is
  exactly why the pending rotation matters.)
- **Revocation lag.** Local verification accepts a token until `exp` even after sign-out or user
  ban (sign-out deletes the session row, not the issued JWT). Default access-token lifetime is
  1 h. For sensitive endpoints the docs' pattern is to check that `session_id` still exists in
  `auth.sessions` (or call `getUser()`); fine as a targeted opt-in, not per-request.
- **Don't hand-verify HS256.** Never copy the legacy JWT secret into `apps/api` env — that's the
  compromise-prone pattern the signing-keys system exists to kill.

## 4. API-key migration and the pending rotation

API keys and user JWTs are **separate, independent migrations**. New keys are opaque strings, not
JWTs: `sb_publishable_*` (client-side; maps to `anon`/`authenticated` roles) and `sb_secret_*`
(server-only; `service_role`, bypasses RLS; rejected if sent from browsers). Both generations
work simultaneously until legacy keys are disabled (reversible) — Supabase deletes legacy keys
**late 2026** (new projects stopped getting them Nov 2025; nag emails since Mar 2026).

Note: new keys are sent as the `apikey` header, not `Authorization: Bearer` — supabase-js handles
this; only hand-rolled REST calls and webhooks need care. `Authorization` is thereby freed up to
carry the *user's* JWT exclusively.

**Rotation plan for mentis (secret-key rotation is pending):**

1. Dashboard → API Keys → create `sb_publishable_*` and one `sb_secret_*` per consumer (they
   support multiple named secret keys, so `apps/api` gets its own, rotatable independently).
2. **Mobile:** swap the `anon` key for the publishable key — a one-line env change. Google/Apple
   sign-in through supabase-js is untouched (API keys identify the *app*, not the user; session
   JWTs are unaffected, nobody is logged out).
3. **apps/api:** born on `sb_secret_*`; never sees a legacy key or the JWT secret.
4. Disable legacy `anon`/`service_role` keys. **Do this before EAS release**: once binaries with
   the legacy anon key are in users' hands, disabling breaks old installs (the docs' "callers
   that are easy to miss" warning). Pre-launch it costs nothing.
5. Then run the signing-key rotation from §1 and finally revoke the legacy JWT secret (step 4 is
   its prerequisite). Result: the old `service_role` key — the thing whose rotation was pending —
   is dead, and nothing forge-capable remains in any env file.

## 5. Storage and key types

Storage authorizes through RLS policies on `storage.objects`; a service key "entirely bypasses
RLS policies, granting unrestricted access to all Storage APIs". The migration guide lists
Storage as fully supporting the new keys — so `apps/api` doing server-side Storage work with its
`sb_secret_*` key behaves exactly as with the legacy `service_role` key. No Storage-specific
reason to keep legacy keys. (Peripheral caveats, noted for completeness: Realtime public
connections on new keys are capped at 24 h unless upgraded with user auth; Edge Functions'
built-in `verify_jwt` only understands legacy keys — irrelevant here since `apps/api` replaces
both use cases.)

## Key setup for apps/api (summary)

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...   # service client only; bypasses RLS; never in mobile
```

```ts
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
```

Identity comes from the guard (`request.user.id`), data access from the service client with
explicit filters — the API is the trust boundary.

## Sources

- JWT signing keys (migration, standby/rotate, JWKS, revocation): https://supabase.com/docs/guides/auth/signing-keys
- JWTs and server-side verification (jose/JWKS example, HS256 warning): https://supabase.com/docs/guides/auth/jwts
- JWT claims reference: https://supabase.com/docs/guides/auth/jwt-fields
- `auth.getClaims()` reference: https://supabase.com/docs/reference/javascript/auth-getclaims
- API keys (publishable/secret, deprecation, Bearer restriction): https://supabase.com/docs/guides/api/api-keys
- Migrating to new API keys (order, product support, mobile warning): https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
- Sessions (lifetimes, refresh, sign-out semantics, `session_id` check): https://supabase.com/docs/guides/auth/sessions
- Storage access control (service key bypasses RLS): https://supabase.com/docs/guides/storage/security/access-control
- API keys changelog / timeline: https://supabase.com/changelog/29260-upcoming-changes-to-supabase-api-keys
