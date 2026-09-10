#!/bin/bash
set -eo pipefail
cd "$(dirname "$0")"

LAST=/tmp/ralph-last-message.txt
TASK="
1. Find the highest-priority task and implement it. \
2. Run your tests and type checks. \
3. Update the PRD with what was done. \
4. Append your progress to progress.txt. \
5. Commit your changes. \
ONLY WORK ON A SINGLE TASK. \
If the PRD is complete, output <promise>COMPLETE</promise>."

sbx ls | grep -q '^ralph' || sbx create --name ralph claude . /Users/hugobayoud/prog/mentis

for ((i=1; i<=$1; i++)); do
  echo "=== Ralph $i/$1 : $(date +%H:%M) ==="
  sbx exec -w "$PWD" ralph claude -p "@PRD.md @progress.txt @AGENTS.md $TASK" \
    --dangerously-skip-permissions \
    --model claude-opus-5 --effort high \
    --disallowedTools "Bash(bun run migration:*),Bash(git merge *),Bash(git push *)" \
    --max-turns 200 | tee "$LAST"
  git push origin HEAD
  grep -q "<promise>COMPLETE</promise>" "$LAST" && { echo "PRD complete after $i iterations."; exit 0; }
done