# What serving jouer.frogster-studio.com takes

Research for [#92](https://github.com/frogster-studio/mentis/issues/92), map [#87](https://github.com/frogster-studio/mentis/issues/87). Facts gathered 2026-11-20; nothing was changed on DNS, Vercel or Railway.

## Answer

Five steps, in this order:

1. **Vercel project** — create a third project (e.g. `mentis-play`) in the same Vercel team as admin and the site, Root Directory `apps/mobile`, and record its id as a GitHub Actions variable (proposed name `VERCEL_PLAY_PROJECT_ID`).
2. **Env** — on that project's Production environment set `APP_VARIANT=production` plus the seven `EXPO_PUBLIC_*` names `app.config.ts` requires, with the values the EAS `production` environment already holds.
3. **CI job** — add `play-changed` + `deploy-play` to `.github/workflows/ci.yml`, copies of the `web` pair: same `VERCEL_TOKEN` secret and `VERCEL_ORG_ID` variable, the new project-id variable, a path filter on `apps/mobile/`, `packages/contracts/`, `packages/answer-matching/`, `bun.lock` and `ci.yml`. The build itself is described by an `apps/mobile/vercel.json`.
4. **DNS** — add the domain `jouer.frogster-studio.com` to the project, then at **OVHcloud** create a `CNAME` record `jouer` → the project-specific `*.vercel-dns-017.com` target Vercel displays. No TXT verification: the apex is already in this Vercel team.
5. **API origin** — on the Railway API service set `CORS_ORIGINS=https://jouer.frogster-studio.com` and deploy the staged change. No code change: the allowlist is already wired.

## 1. DNS — OVHcloud

No repo file names the DNS host. Live lookups (2026-11-20):

| Query | Answer | Reading |
| --- | --- | --- |
| `dig NS frogster-studio.com` | `ns109.ovh.net`, `dns109.ovh.net` | The zone is served by OVHcloud. |
| `dig TXT frogster-studio.com` | `v=spf1 include:mx.ovh.com -all` (+ an OVH marker) | Mail is OVH too, so the nameservers stay put. |
| `dig A frogster-studio.com` | `216.198.79.1` | Vercel's apex A value: the site project already owns the apex. |
| `dig CNAME www.frogster-studio.com` | `<id>.vercel-dns-017.com` | Same team, project-specific CNAME. |
| `dig jouer.frogster-studio.com` | nothing | The subdomain is free. |

How a subdomain is added ([Vercel — Adding a custom domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain)):

- In the project, **Settings → Domains → Add Existing**, enter `jouer.frogster-studio.com`.
- "You can configure subdomains with a CNAME record. Each project has a unique CNAME record e.g. `d1d4fc829fe7bc7c.vercel-dns-017.com`." — use the value the dashboard shows, not the `www` one.
- TXT verification is only asked "if the domain is in use by another Vercel account or team". Here it is the same team, so none is expected.
- Changing the A/CNAME at the current provider "does not require moving the rest of your DNS records" — keep OVH nameservers (mail depends on them).

At OVHcloud ([DNS zone edit guide](https://docs.ovhcloud.com/en/guides/web-cloud/domains/dns-zone-edit)): **Web Cloud → Domains & DNS → frogster-studio.com → DNS Zone → Create a record → CNAME**, Subdomain `jouer`, Target the Vercel value. The form adds the trailing dot itself; propagation is up to 24 h. Vercel issues the certificate once the record resolves.

## 2. Vercel project and build

### How admin and the site deploy today (`.github/workflows/ci.yml`)

- The Hobby plan's Git integration cannot deploy a private organization repo, so both deploy from Actions (comment in `ci.yml`, `apps/admin/README.md` § Deployment).
- Each app has a pair of jobs, push-to-`main` only:
  - `<app>-changed` diffs `github.event.before..github.sha` and greps a path regex; a missing base deploys anyway.
  - `deploy-<app>` needs `check` and the filter, has a `concurrency` group without cancellation, and runs three commands from the repo root:
    ```
    bunx vercel@58 pull --yes --environment=production
    bunx vercel@58 build --prod
    bunx vercel@58 deploy --prebuilt --prod
    ```
- Credentials by name: secret `VERCEL_TOKEN`; variables `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (admin), `VERCEL_WEB_PROJECT_ID` (site). The new job needs one more variable, nothing secret.
- Path filters: admin `apps/admin/|packages/contracts/|bun.lock|ci.yml`; site `apps/web/|apps/mobile/assets/app-icon/|bun.lock|ci.yml`.
- No `vercel.json` exists in the repo: Root Directory and framework come from each project's dashboard settings, which `vercel pull` writes locally and `vercel build` reads ([vercel build](https://vercel.com/docs/cli/build): "run the `vercel pull` command before invoking `vercel build` to ensure that you have the most recent Project Settings and Environment Variables"). `vercel build --prod` uses the Production environment variables.
- `deploy --prebuilt` uploads only `.vercel/output`, so the monorepo's file count never matters.

### What the Expo build needs

- Expo's Vercel recipe ([Publishing websites](https://docs.expo.dev/guides/publishing-websites/)) is a `vercel.json` at the app root: `"buildCommand": "expo export -p web"`, `"outputDirectory": "dist"`, `"framework": null`, plus `"cleanUrls": true` and an SPA rewrite `"/:path*" → "/"`. With Root Directory `apps/mobile` that file lives at `apps/mobile/vercel.json`. The rewrite and the `web.output` mode (`static` today in `app.config.ts`) are [#88](https://github.com/frogster-studio/mentis/issues/88)'s call, not this ticket's.
- **Shared packages must be built first on web.** `@mentis/contracts` and `@mentis/answer-matching` export source only under the `bun` and `react-native` conditions; every other resolver, Metro on web included, gets `default` → `dist/`, which is gitignored. So the build command is, for example, `bun run --filter @mentis/contracts build && bun run --filter @mentis/answer-matching build && expo export -p web` — or Metro is taught the `react-native` condition on web. Either way it is an implementation choice, but without it the bundle fails.
- `bun` is on the runner (`oven-sh/setup-bun@v2`), and Vercel picks `bun install` from `bun.lock`, as it already does for admin and the site.

## 3. Environment

`apps/mobile/app.config.ts`:

- `APP_VARIANT` (default `development`) chooses `.env.${APP_VARIANT}`; when that file is absent — CI, EAS, Vercel — it reads `process.env`. `vercel build` puts the pulled Production variables in that environment.
- At config time it **throws** unless all seven are present: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`. The Theme Link only uses the API URL, but the build needs all seven unless the config is relaxed for web.
- They reach the app through `extra` → `Constants.expoConfig.extra` (`src/lib/api/index.ts` reads `apiUrl`). They are client values, already shipped inside the iOS binary; their source of truth is the EAS `production` environment named by `eas.json`.
- So the Vercel project's Production env is `APP_VARIANT=production` + those seven names.

## 4. API origin — Railway

`apps/api/src/bootstrap.ts`:

```ts
app.enableCors({ origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : false });
```

- `CORS_ORIGINS` (`_config/env.config.ts`) is a comma-separated string, trimmed, empties dropped, default `""` — so production rejects every browser origin today. `.env.example` already notes it is to be set "when Expo web ships".
- The value must be the exact origin `https://jouer.frogster-studio.com` (scheme + host, no trailing slash, no path). `*.vercel.app` deployment URLs stay blocked, which is fine: the job only ships production.
- The Theme Link's reads are public: the client sends no `Authorization` and no `content-type` on a bodiless GET (`src/lib/api/client.ts`), so they are simple requests with no preflight.
- Railway: "Adding, updating, or removing variables, results in a set of staged changes that you must review and deploy, in order to apply them" ([Railway — Variables](https://docs.railway.com/guides/variables)). Set the variable, then deploy the staged change.

## Open for other tickets

- `/<slug>` routing, the SPA rewrite and `web.output` (`static` vs `single`): #88.
- Per-slug link preview cards may need more than static files on Vercel: #90.
- A universal link would add an `apple-app-site-association` file on this host: #93.
