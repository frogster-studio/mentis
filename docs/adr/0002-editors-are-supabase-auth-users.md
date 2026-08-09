# Editors are Supabase Auth users, tiered by claim

Admin editors authenticate through Supabase Auth — the same user pool as mobile players — and are hand-provisioned: created in the Supabase dashboard, then stamped `app_metadata.role = "editor"` (a single server-controlled string that rides tamper-proof inside every JWT). The admin app runs the whole flow server-side: login is a server action, the session lives in `@supabase/ssr` cookies, and each BFF call forwards the editor's access token as `Authorization: Bearer` to `apps/api`, whose `/admin/*` guard shares one verification core with `/app/me/*` and then requires the editor claim.

One pool plus one claim won over a parallel identity system or a shared service secret because it leaves **zero cross-service secrets** — nothing to rotate or leak between Vercel and Railway — while giving per-editor identity on every request and real revocation (banning the user kills the refresh token) for free.

## Consequences

- Authentication alone never opens `/admin/*`: a valid player JWT without the editor claim gets `403 FORBIDDEN`; a missing or invalid token gets `401 UNAUTHENTICATED`.
- Editor lifecycle (create, reset password, revoke) is a dashboard/SQL operation by design — no self-service signup or reset surface exists in admin.
- Removing the claim takes effect on the next access-token refresh (up to ~1h); immediate lockout = ban the user.
- The claim stays a single string; a roles array or hierarchy is a deliberate future amendment, not accommodated now.
