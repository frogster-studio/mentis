#!/bin/bash
cd "$(dirname "$0")"

claude --permission-mode acceptEdits "@PRD.md @progress.txt @AGENTS.md \
1. Read the PRD and progress file. \
2. Pick the next item with passes: false. Prioritize in this order: \
   schema and core abstractions, integration points, unknown unknowns, \
   standard features, polish. Not necessarily the first in the list. \
3. Implement it. Keep the change small: one logical change, one commit. \
4. Before committing, run ALL feedback loops: bun run check from the repo root. \
   Do NOT commit if it fails. Fix first. \
5. Set that item's passes to true in PRD.md. \
6. Commit your changes with a conventional message. Never git push. \
7. Append to progress.txt: item done, decisions and why, files changed, \
   blockers or notes for the next iteration. Concise, sacrifice grammar. \
ONLY DO ONE ITEM AT A TIME. \
Never run bun run migration:generate: the human does it. \
This is production code. It must be maintainable. Fight entropy."
