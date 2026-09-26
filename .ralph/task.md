1. Pick the next item with passes: false. Prioritize in this order: schema and core abstractions, integration points, unknown unknowns, standard features, polish. Not necessarily the first in the list.
2. Implement it as a tracer bullet: a tiny slice through every layer the item touches first, then expand from there. Keep the change small: one logical change, one commit.
3. Before committing, run ALL feedback loops: bun run check from the repo root. Do NOT commit if it fails. Fix first.
4. Set that item's passes to true in PRD.md.
5. Append to progress.txt: item done, decisions and why, files changed, blockers or notes for the next iteration. Concise, sacrifice grammar.
6. Commit your changes with a conventional message. Never git push.
ONLY DO ONE ITEM AT A TIME.
Never run bun run migration:generate: the human does it.
This is production code. It must be maintainable. Fight entropy.
If every item of the PRD passes, output <promise>COMPLETE</promise>.
