#!/bin/bash
set -e
cd "$(dirname "$0")"

CLI=claude
for arg in "$@"; do
  case "$arg" in
    --cli=claude|--cli=codex) CLI="${arg#--cli=}" ;;
    *) echo "Usage: $0 [--cli=claude|--cli=codex]"; exit 1 ;;
  esac
done

TASK="1. Pick the next item with passes: false. Prioritize in this order: \
schema and core abstractions, integration points, unknown unknowns, \
standard features, polish. Not necessarily the first in the list. \
2. Implement it. Keep the change small: one logical change, one commit. \
3. Before committing, run ALL feedback loops: bun run check from the repo root. \
Do NOT commit if it fails. Fix first. \
4. Set that item's passes to true in PRD.md. \
5. Commit your changes with a conventional message. Never git push. \
6. Append to progress.txt: item done, decisions and why, files changed, \
blockers or notes for the next iteration. Concise, sacrifice grammar. \
ONLY DO ONE ITEM AT A TIME. \
Never run bun run migration:generate: the human does it. \
This is production code. It must be maintainable. Fight entropy."

case "$CLI" in
  claude)
    claude --permission-mode acceptEdits \
      --allowedTools "Bash(bun run *),Bash(bunx *),Bash(git add *),Bash(git commit *)" \
      --disallowedTools "Bash(bun run migration:generate*),Bash(git push *)" \
      "@PRD.md @progress.txt @AGENTS.md $TASK"
    ;;
  codex)
    codex -m gpt-6-astra -s danger-full-access -a never \
      "Read PRD.md and progress.txt. $TASK"
    ;;
esac
