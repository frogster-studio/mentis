#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

CLAUDE_CMD="${RALPH_CLAUDE:-docker sandbox run claude}"

for ((i=1; i<=$1; i++)); do
  echo "=== Ralph $i/$1 : $(date +%H:%M) ==="
  result=$($CLAUDE_CMD --permission-mode acceptEdits -p \
    --allowedTools "Bash(bun run *),Bash(bunx *),Bash(git add *),Bash(git commit *)" \
    --disallowedTools "Bash(bun run migration:generate*),Bash(git push *)" \
    --max-turns 200 \
    "@PRD.md @progress.txt @AGENTS.md \
1. Read the PRD and progress file. \
2. Pick the highest-priority item with passes: false: schema first, then integration, \
   then unknowns, then features, then polish. \
3. Implement it. One logical change, one commit. \
4. Run bun run check from the repo root. Do NOT commit if it fails. Fix first. \
5. Set the item's passes to true in PRD.md. \
6. Commit with a conventional message. Never git push. \
7. Append to progress.txt: item, decisions, files, notes for next iteration. Concise. \
ONLY WORK ON A SINGLE ITEM. \
Never run bun run migration:generate: the human does it. \
This is production code. It must be maintainable. Fight entropy. \
If every item has passes: true, output <promise>COMPLETE</promise>.")

  echo "$result"
  git push origin HEAD

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete after $i iterations."
    exit 0
  fi
done
