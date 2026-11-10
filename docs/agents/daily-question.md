# Daily question

One run brings one Question from authored to Ready To Be Published and writes the Anecdote that goes with it. The Editor approves every word: the Catalog stays as it is until his « ok ». Talk to him in French.

## 1. Sign in

The run is an Editor account of its own. Its environment carries `MENTIS_API_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `CURATION_BOT_EMAIL` and `CURATION_BOT_PASSWORD`.

`POST $SUPABASE_URL/auth/v1/token?grant_type=password`, header `apikey: $SUPABASE_PUBLISHABLE_KEY`, JSON body `{ email, password }`, answers an `access_token`: the `Authorization: Bearer` of every `/admin/*` call. The token and the password live in a file outside the repository and in the environment, out of every message and command output.

Request and response shapes are the schemas in `packages/contracts/src/admin/`.

Done when `GET $MENTIS_API_URL/admin/themes` answers 200.

## 2. Pick the Question

1. Read [editorial-style.md](editorial-style.md) whole.
2. `GET /admin/themes`. Among the Themes with a Question left to polish (`readyQuestionCount < questionCount`), take an unpublished one before a Published one, then the one holding the most Ready Questions, then the first by name.
3. `GET /admin/questions?themeId=…` lists newest first: take the oldest Question whose `readyToBePublished` is false.

Done when one Question is in hand. When no Theme has a Question left, tell the Editor and stop.

## 3. Polish

Fact-check the Question on the web: its Canonical Answer holds against two independent sources, and each wrong choice is refuted by one. Then rewrite every field and write the Anecdote.

Done when every rule of [editorial-style.md](editorial-style.md) is applied and every limit of the contracts is met.

## 4. Propose

Post one message: each field before → after, the Anecdote, the sources, whatever the fact-check overturned, and the Theme's Ready count out of 20. End the turn there — the Editor answers in this session.

## 5. Apply the answer

A correction: revise, show the changed fields again, and add to [editorial-style.md](editorial-style.md) every preference he would want applied next time. Repeat until his « ok ».

His « ok »:

1. `PATCH /admin/questions/:id` with the whole approved Question — the write replaces every field.
2. `PATCH /admin/questions/:id/staging` with `{ "readyToBePublished": true }`.
3. `POST /admin/anecdotes` with the approved text.
4. Read the Question back: it equals the approved proposal character for character.
5. Add one to the counter of [editorial-style.md](editorial-style.md), commit that file alone as `chore(curation): the daily run brings a Question to Ready`, and push it to `main`.
6. Give the Editor the Theme's new Ready count. From 20 on an unpublished Theme, tell him it can be Published from the dashboard: that switch is his.

Done when the push has landed.
