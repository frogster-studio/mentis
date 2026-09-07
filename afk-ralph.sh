#!/bin/bash
set -eo pipefail
cd "$(dirname "$0")"

CLI=claude
ITERATIONS=""
for arg in "$@"; do
  case "$arg" in
    --cli=claude|--cli=codex) CLI="${arg#--cli=}" ;;
    [0-9]*) ITERATIONS="$arg" ;;
    *) echo "Usage: $0 <iterations> [--cli=claude|--cli=codex]"; exit 1 ;;
  esac
done
if [ -z "$ITERATIONS" ]; then
  echo "Usage: $0 <iterations> [--cli=claude|--cli=codex]"
  exit 1
fi

LAST=/tmp/ralph-last-message.txt

TASK="1. Pick the highest-priority item with passes: false: schema first, then integration, \
then unknowns, then features, then polish. \
2. Implement it. One logical change, one commit. \
3. Run bun run check from the repo root. Do NOT commit if it fails. Fix first. \
4. Set the item's passes to true in PRD.md. \
5. Commit with a conventional message. Never git push. \
6. Append to progress.txt: item, decisions, files, notes for next iteration. Concise. \
ONLY WORK ON A SINGLE ITEM. \
Never run bun run migration:generate: the human does it. \
This is production code. It must be maintainable. Fight entropy. \
If every item has passes: true, output <promise>COMPLETE</promise>."

for ((i=1; i<=ITERATIONS; i++)); do
  echo "=== Ralph $i/$ITERATIONS ($CLI) : $(date +%H:%M) ==="
  : > "$LAST"
  case "$CLI" in
    claude)
      claude -p --permission-mode acceptEdits \
        --allowedTools "Bash(bun run *),Bash(bunx *),Bash(git add *),Bash(git commit *)" \
        --disallowedTools "Bash(bun run migration:generate*),Bash(git push *)" \
        --max-turns 200 \
        "@PRD.md @progress.txt @AGENTS.md $TASK" | tee "$LAST"
      ;;
    codex)
      codex exec -m gpt-6-astra --dangerously-bypass-approvals-and-sandbox --ephemeral \
        -o "$LAST" \
        "Read PRD.md and progress.txt. $TASK"
      ;;
  esac

  if [ "$CLI" = "claude" ]; then
    git push origin HEAD
  fi

  if grep -q "<promise>COMPLETE</promise>" "$LAST"; then
    echo "PRD complete after $i iterations."
    exit 0
  fi
done
