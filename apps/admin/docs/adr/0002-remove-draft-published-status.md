# Remove the Draft/Published Card status

The PRD gave every Card a Draft/Published status (stories 25, 32, 52) as both an editorial workflow marker and the future consumer app's "only consume validated content" gate. In practice the status went unused, and once per-Social Posted bookkeeping arrived (glossary: Social, Posted) it became actively confusing — "published" then meant two unrelated things. We removed the status entirely: the `status` column is dropped (its data is unrecoverable), and no status filter, badge, or form switch remains.

## Consequences

- The PRD still describes Published; it is a historical document and deliberately not rewritten — this ADR is the pointer to the contradiction.
- A future consumer app loses its validation gate (PRD story 52). If one materializes, it needs a new mechanism (a new flag, or deriving readiness from Posted marks).
- "Published"/"posted" vocabulary is now reserved exclusively for the Posted-on-Social state.
