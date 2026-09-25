#!/bin/bash
set -eo pipefail
cd "$(dirname "$0")"

LAST=/tmp/ralph-last-message.txt

# To access Claude's API from Docker Sandbox
ENV_FILE="${RALPH_ENV_FILE:-$HOME/.config/mentis/ralph.env}"
[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE - put CLAUDE_CODE_OAUTH_TOKEN=... in it" >&2; exit 1; }

# Instructions for Ralph to follow on each iteration
TASK="
1. Find the highest-priority task and implement it. When building features, build a tiny, end-to-end slice of the feature first, seek feedback, then expand out from there. Tracer bullets comes from the Pragmatic Programmer. When building systems, you want to write code that gets you feedback as quickly as possible. Tracer bullets are small slices of functionality that go through all layers of the system, allowing you to test and validate your approach early. This helps in identifying potential issues and ensures that the overall architecture is sound before investing significant time in development. \
2. Run your tests and type checks. \
3. Update the PRD with what was done. \
4. Append your progress to progress.txt. \
5. Commit your changes. \
ONLY WORK ON A SINGLE TASK. \
If the PRD is complete, output <promise>COMPLETE</promise>."

sbx ls | grep -q '^ralph' || sbx create --name ralph claude . /Users/hugobayoud/prog/mentis

for ((i=1; i<=$1; i++)); do
  echo "=== Ralph $i/$1 : $(date +%H:%M) ==="
  sbx exec -w "$PWD" --env-file "$ENV_FILE" ralph claude -p "@PRD.md @progress.txt @AGENTS.md $TASK" \
    --dangerously-skip-permissions \
    --model claude-opus-5 --effort high \
    --disallowedTools "Bash(bun run migration:*),Bash(git merge *),Bash(git push *)" \
    --max-turns 200 < /dev/null | tee "$LAST"
  git push origin HEAD
  grep -q "<promise>COMPLETE</promise>" "$LAST" && { echo "PRD complete after $i iterations."; exit 0; }
done