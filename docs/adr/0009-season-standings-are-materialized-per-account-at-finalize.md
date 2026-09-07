# Season standings are materialized per Account at finalize

The Leaderboard must answer "who leads this Season, and where do I stand" for a signed-out Player on every Compétition tab open, while a Season Total is an aggregate over every finalized Attempt of a calendar month — a sum of per-day bests, itself a max over the day's Attempts. So the API keeps one materialized row per Account per Season — `competition_standings`, `owner` and `season` unique, carrying the `total` — written inside the finalize transaction ([ADR 0004](0004-competition-answers-are-judged-server-side.md)), the lazy zero-finalize of a dead day included. The write never increments: it recomputes the owner's total for that Attempt's Season from every finalized Attempt of the Season and upserts, so a replayed finalize, an out-of-order one and a repair all land on the same value. Ranks, pages and counts are never stored — they are derived at read from this table, ordered `total DESC, pseudo_key ASC`, with `RANK()` over the first `LEADERBOARD_PAGE_SIZE × N` rows for a Leaderboard page and three scalar counts for a Standing.

We rejected a Redis sorted set (the natural ranking structure, but a new infrastructure piece, a new secret, a rebuild path after any flush, and a second way to reach data against [ADR 0005](0005-the-api-reaches-its-data-through-typeorm.md)'s TypeORM-only rule), a materialized view over the Attempts (staleness between refreshes right after a finalize, a cron to own, and repeated full rebuilds of a table that changes one row at a time) and read-time aggregation over `competition_attempts` (correct and storage-free, but O(n) over the Season's whole transcript on every public page view, unauthenticated and uncacheable by design). The choice serves an MVP under 100 000 Accounts; scaling past it means a ranking index such as Redis sorted sets fed from this table, not a different source of truth.

## Consequences

- A page read costs O(page × N) plus one index-only `count(*)`; both are accepted bounds, and a deep page costs more than a shallow one.
- The Leaderboard joins `player_profiles` at read rather than denormalizing the pseudo, so a rename shows on the next page view.
- Finalize gains a write it did not have: the transaction now touches the standings row, and a finalize that lost its claim writes nothing.
- The new table gets the ADR 0003 locks (RLS on, zero policies) as hand-run SQL once the migration lands.
- Only the current Season is served; past Seasons stay readable in the table but no route exposes them.
