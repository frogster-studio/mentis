# Daily question

One run brings one Question from authored to Ready To Be Published and writes the Anecdote that goes with it. The Editor approves every word: the Catalog stays as it is until his « ok ». Talk to him in French, as briefly as possible: before → after for every change, never the reasons for a choice, and always what you wait for from him.

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

Post one message: each changed field before → after — wording, Canonical Answer, Aliases, Misspellings, wrong choices, Explanation — unchanged ones left out; the Anecdote; the Theme's Ready count out of 20; the picture search of section 6 when it applies; last, what he must answer (« ok » or a correction, then a picture or « pas de photo »). End the turn there — the Editor answers in this session.

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

## 6. Picture

Applies only while `apps/api/src/curation/controllers/admin-anecdotes.controller.ts` serves `PUT /admin/anecdotes/:id/image`; otherwise the run ends at 5.

1. In the proposal, when a photo would show the Anecdote's subject itself (the flamboyant in bloom, Snow White's seven dwarfs), give 3 to 4 keywords to paste into Google Images and the whole prompt below, its first line filled in, in one code block the Editor copies and pastes as is — never the first line alone. When nothing is worth seeing, say so.
2. The Editor picks the photo, runs the prompt in Gemini himself and attaches the result here — or answers « pas de photo », which ends the run. The « ok » on the text never waits for the picture.
3. Bring the image to 750 × 1024 px — crop to that ratio, never stretch — as a still WebP.
4. `PUT /admin/anecdotes/:id/image` on the Anecdote posted in 5, the raw file as body, `Content-Type: image/webp` (`curl --data-binary @image.webp`). A non-2xx answer abandons the picture, never the Question: give the Editor the French message of its `ErrorResponse`.

Done when the answered Anecdote carries an `image` or the Editor declined.

```text
La photo montre : <le sujet de l'Anecdote>.
Génère une seule version de cette image avec le rendu d’une photographie éditoriale professionnelle. Utilise la photo fournie comme source pour le sujet, la scène et le point de vue.
Fidélité à la photo. Préserve les éléments qui rendent l’image reconnaissable. Pour une personne, garde ses traits, son expression, sa posture et ses vêtements. Pour un objet ou un détail naturel, respecte sa forme, ses proportions et ses textures. Pour une scène ou un paysage, conserve la disposition des éléments, la perspective et les repères du lieu.
Rendu photographique. Recherche une image réaliste et finement détaillée, avec des couleurs riches mais naturelles, une exposition équilibrée et des textures crédibles. Respecte la direction de la lumière, l’heure apparente et l’ambiance de la photo. Ajuste avec mesure les ombres, les hautes lumières, la balance des blancs et la netteté.
Profondeur de champ. Adapte-la à l’image. En gros plan, garde le sujet net et laisse le fond s’adoucir naturellement. Dans une scène de groupe ou d’action, garde les visages, les gestes et les éléments importants lisibles. Dans un paysage, préserve les détails du premier plan jusqu’aux reliefs lointains, avec la douceur naturelle de la distance.
Cadrage et format. Livre une image verticale de 750 × 1024 px exactement, bord à bord, sans cadre ni texte ajouté. Recadre en gardant le sujet et les éléments essentiels de la scène. Si le passage au portrait risque de couper un élément important, prolonge discrètement le décor existant dans les zones nécessaires. Garde les proportions de la photo et ajuste les dimensions finales sans étirer l’image.
```
