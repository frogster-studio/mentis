#!/bin/bash
set -eo pipefail
cd "$(dirname "$0")"

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

# One sandbox for every worktree: it mounts the main repo only, so worktrees live under it
SANDBOX=ralph
MAIN_REPO="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
WORKTREES="$MAIN_REPO/.claude/worktrees"
LAST="/tmp/$SANDBOX-$(basename "$PWD")-last-message.txt"

if [ "$PWD" != "$MAIN_REPO" ] && [[ "$PWD" != "$WORKTREES"/* ]]; then
  echo "sandbox '$SANDBOX' mounts $MAIN_REPO only, even if it already exists: run from a worktree in $WORKTREES/<branch>" >&2
  echo "  git worktree add $WORKTREES/<branch> -b <branch>" >&2
  exit 1
fi

SANDBOXES="$(sbx ls --json)"
if ! jq -e --arg name "$SANDBOX" '.sandboxes[] | select(.name == $name)' <<< "$SANDBOXES" > /dev/null; then
  sbx create --name "$SANDBOX" claude "$MAIN_REPO"
elif ! jq -e --arg name "$SANDBOX" --arg repo "$MAIN_REPO" \
  '.sandboxes[] | select(.name == $name and .workspace_missing != true) | .workspaces | index($repo)' \
  <<< "$SANDBOXES" > /dev/null; then
  echo "sandbox '$SANDBOX' already exists but lacks $MAIN_REPO or mounts a deleted folder: sbx rm $SANDBOX, then rerun" >&2
  exit 1
fi

for ((i=1; i<=$1; i++)); do
  echo "=== Ralph $i/$1 : $(date +%H:%M) ==="
  sbx exec -w "$PWD" --env-file "$ENV_FILE" "$SANDBOX" claude -p "@PRD.md @progress.txt @AGENTS.md $TASK" \
    --dangerously-skip-permissions \
    --model claude-opus-5-5 --effort high \
    --disallowedTools "Bash(bun run migration:*),Bash(git merge *),Bash(git push *)" \
    --max-turns 200 < /dev/null | tee "$LAST"
  git push origin HEAD
  grep -q "<promise>COMPLETE</promise>" "$LAST" && { echo "PRD complete after $i iterations."; exit 0; }
done