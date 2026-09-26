#!/bin/bash
set -eo pipefail
cd "$(dirname "$0")/.."

# To access Claude's API from Docker Sandbox
ENV_FILE="${RALPH_ENV_FILE:-$HOME/.config/mentis/ralph.env}"
[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE - put CLAUDE_CODE_OAUTH_TOKEN=... in it" >&2; exit 1; }

# The sandbox lacks swc and oxc-parser linux-arm64 bindings, so the full check runs on the host after each iteration.
TASK="$(cat .ralph/task.md)
Exception to step 3, since this sandbox cannot run bun run check in full: run bun run typecheck, the tests of every workspace except @mentis/api, and bunx @biomejs/biome check . instead. Never bun install. The host runs the full check after you."
CHECK_LOG="/tmp/ralph-$(basename "$PWD")-check.txt"

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
  # check rewrites files through knip --fix and biome --write, so a dirty tree is a failure too.
  if ! bun run check > "$CHECK_LOG" 2>&1 || [ -n "$(git status --porcelain)" ]; then
    echo "=== bun run check failed on the host after iteration $i: nothing pushed, fix then rerun ===" >&2
    tail -n 60 "$CHECK_LOG" >&2
    git status --short >&2
    exit 1
  fi
  git push origin HEAD
  grep -q "<promise>COMPLETE</promise>" "$LAST" && { echo "PRD complete after $i iterations."; exit 0; }
done