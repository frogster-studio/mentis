# Curation rules live in the admin client

Publishing policy — the 20-Ready gate that unlocks a Theme's Published switch, the floor that blocks un-readying the 20th Question, the delete guards (no deleting a Published Theme, no deleting a non-empty Category beyond the DB's own RESTRICT) — is enforced by the dashboard UI alone. The API's `/admin/*` surface accepts any flag write from an authenticated Editor, and the serving queries filter only on the stored flags (`theme.published AND question.ready_to_be_published`), never recomputing counts. Chosen over API-side enforcement to keep the serving path flat and the gateway free of back-office policy; with a hand-provisioned handful of Editors, the blast radius of a violated invariant is contained by the app's own Draw eligibility rule.

The line is policy vs integrity: data-shape validation (a Question only saves complete — text plus four answers, one designated correct) stays on both sides, client and API.

## Consequences

- A dashboard bug or concurrent tab can produce a Published Theme under 20 Ready Questions; serving will happily expose it. Accepted.
- Future agents must not "fix" the API by adding threshold checks to toggle endpoints or serving queries — that reopens this ADR.
