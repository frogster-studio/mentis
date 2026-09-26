#!/bin/bash
set -e
cd "$(dirname "$0")/.."

TASK="$(cat .ralph/task.md)
Once the first end-to-end slice works, show it to me and wait for my feedback before expanding."

# The prompt goes first: --disallowedTools is variadic and would swallow it.
claude "@PRD.md @progress.txt @AGENTS.md $TASK" \
  --permission-mode auto \
  --model claude-opus-5-5 --effort high \
  --disallowedTools "Bash(bun run migration:*),Bash(git merge *),Bash(git push *)"
