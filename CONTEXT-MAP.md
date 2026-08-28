# Context Map

## Contexts

- [Quiz play](./apps/mobile/CONTEXT.md) — the player's game: sessions, competition, scoring
- [Catalog curation](./apps/admin/CONTEXT.md) — the Editor's back-office: authoring and staging the Catalog

## Relationships

- **Curation → Quiz play**: curation stages the Catalog; the app is served only Questions that are Ready To Be Published inside a Published Theme, and a Category exists for players only while Visible. Curation rules (the 20-Ready gate) never leak into serving.
- **Shared vocabulary**: Category, Theme and Question are the same concepts in both contexts; Quiz play defines their player-facing meaning, curation adds their staging states.
