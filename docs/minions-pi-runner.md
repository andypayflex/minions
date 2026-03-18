# Minions runtime execution and delivery

Minions uses Pi RPC as its autonomous repository execution backend when `MINIONS_EXECUTION_MODE=agent-runner`.

## Environment

Use these environment variables to configure runtime:

### Execution
- `MINIONS_EXECUTION_MODE` — `simulated` or `agent-runner`.
- `MINIONS_ORCHESTRATION_MODE` — `single-runner` or `gsd-team`.
- `MINIONS_PI_COMMAND` — Pi CLI command to spawn. Defaults to `pi`.
- `MINIONS_PI_PROVIDER` — optional Pi provider name passed to `pi --mode rpc --provider`. Unsupported or ambiguous values like `codex` are ignored rather than forwarded to Pi.
- `MINIONS_PI_MODEL` — optional model id/pattern passed to `pi --mode rpc --model`.
- `MINIONS_PI_SESSION_DIR` — optional Pi session directory.
- `MINIONS_PI_ARGS` — optional extra CLI args, space-separated.
- `MINIONS_GSD_TEAM` — runtime team selection for `gsd-team` orchestration. Defaults to `gsd-execution`.

### Delivery
- `MINIONS_DELIVERY_MODE` — `simulated`, `local-git`, or `github-pr`.
- `MINIONS_GH_COMMAND` — GitHub CLI command. Defaults to `gh`.
- `MINIONS_GIT_COMMAND` — git command. Defaults to `git`.
- `MINIONS_GITHUB_BASE_BRANCH` — base branch for PR creation.
- `MINIONS_GITHUB_PR_DRAFT` — whether created PRs should be drafts.
- `MINIONS_GITHUB_PR_REQUIRE_CLEAN_WORKTREE` — if true, github-pr preflight requires a clean worktree.

## Behavior

- In `single-runner` mode, Minions sends one headless RPC prompt for task analysis and one for execution.
- In `gsd-team` mode, Minions uses a non-interactive runtime orchestrator that loads repo-local GSD team metadata from `.pi/agents` and delegates execution through the existing runner contract.
- The current `gsd-team` implementation is an approximation layer, not a full interactive multi-agent runtime. It preserves the same normalized execution result contract for Minions.
- Each execution prompt requires a tagged JSON final-output contract:
  - analysis: `<MINIONS_ANALYSIS_RESULT>...</MINIONS_ANALYSIS_RESULT>`
  - execution: `<MINIONS_EXECUTION_RESULT>...</MINIONS_EXECUTION_RESULT>`
- If Pi exits successfully but does not return a parseable tagged contract, the runner reports failure and Minions falls back to its existing recovery path.
- For `github-pr` delivery, Minions now runs preflight checks for `gh`, GitHub auth, git worktree presence, origin remote, and optionally clean-worktree enforcement before attempting PR publication.

## Provider labels

- Direct Pi runner results use provider `pi-rpc`.
- GSD-orchestrated runtime results use provider `gsd-team` while preserving the same final result shape.
