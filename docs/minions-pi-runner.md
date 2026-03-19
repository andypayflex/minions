# Minions runtime execution and delivery

Minions uses Pi RPC as its autonomous repository execution backend when `MINIONS_EXECUTION_MODE=agent-runner`.

## Environment

Use these environment variables to configure runtime:

### Execution
- `MINIONS_EXECUTION_MODE` — `simulated` or `agent-runner`.
- `MINIONS_ORCHESTRATION_MODE` — `single-runner` or `gsd-team`.
- `MINIONS_PI_COMMAND` — Pi CLI command to spawn. Defaults to `pi`.
- `MINIONS_PI_PROVIDER` — optional Pi provider name passed to `pi --mode rpc --provider`. Subscription aliases `openai-chatgpt-subscription` and `openai-codex` (plus legacy `codex`) reuse real Pi `/login` bootstrap/detection via the shared `PI_CODING_AGENT_DIR`. During headless RPC, Minions now passes `--provider openai-codex` explicitly and, when isolation remains enabled, seeds the isolated `PI_CODING_AGENT_DIR` with only the auth artifacts copied from the shared authenticated dir.
- `MINIONS_PI_MODEL` — optional model id/pattern passed to `pi --mode rpc --model`.
- `MINIONS_PI_SESSION_DIR` — optional Pi session directory.
- `MINIONS_PI_ARGS` — optional extra CLI args, space-separated.
- `MINIONS_PI_DISABLE_RESOURCE_DISCOVERY` — defaults to `true`. When enabled, Minions launches Pi RPC with `--no-extensions --no-skills --no-prompt-templates --no-themes` to avoid interactive/global resource discovery side effects. Set to `false` to opt out.
- `MINIONS_PI_ISOLATE_AGENT_DIR` — defaults to `true`. When enabled, Minions sets `PI_CODING_AGENT_DIR` for Pi RPC runs to an isolated Minions-owned directory. Set to `false` to reuse the ambient Pi agent dir.
- `MINIONS_PI_AGENT_DIR` — optional explicit isolated `PI_CODING_AGENT_DIR` path. When unset and isolation is enabled, Minions uses a temp dir under the OS temp root.
- `MINIONS_PI_SUBSCRIPTION_AGENT_DIR` — optional stable shared Pi agent directory for subscription-authenticated runs. Defaults to `~/.minions/pi-subscription-auth`.
- `MINIONS_GSD_TEAM` — runtime team selection for `gsd-team` orchestration. Defaults to `gsd-execution`.

### Delivery
- `MINIONS_DELIVERY_MODE` — `simulated`, `local-git`, or `github-pr`.
- `MINIONS_GH_COMMAND` — GitHub CLI command. Defaults to `gh`.
- `MINIONS_GIT_COMMAND` — git command. Defaults to `git`.
- `MINIONS_GITHUB_BASE_BRANCH` — base branch for PR creation.
- `MINIONS_GITHUB_PR_DRAFT` — whether created PRs should be drafts.
- `MINIONS_GITHUB_PR_REQUIRE_CLEAN_WORKTREE` — if true, github-pr source-repo preflight requires a clean main worktree before Minions creates the isolated run worktree. Delivery preflight runs inside the isolated worktree and never blocks on execution-created dirty state. `.tmp/**` runtime artifacts are ignored by cleanliness enforcement.

## Behavior

- In `single-runner` mode, Minions sends one headless RPC prompt for task analysis and one for execution.
- By default, headless Pi RPC runs are isolated from repo/global interactive resources: Minions disables extensions, skills, prompt templates, and themes discovery, and also points `PI_CODING_AGENT_DIR` at an isolated directory unless explicitly opted out.
- In `gsd-team` mode, Minions uses a non-interactive runtime orchestrator that loads repo-local GSD team metadata from `.pi/agents` and delegates execution through the existing runner contract.
- The current `gsd-team` implementation is an approximation layer, not a full interactive multi-agent runtime. It preserves the same normalized execution result contract for Minions.
- Each execution prompt requires a tagged JSON final-output contract:
  - analysis: `<MINIONS_ANALYSIS_RESULT>...</MINIONS_ANALYSIS_RESULT>`
  - execution: `<MINIONS_EXECUTION_RESULT>...</MINIONS_EXECUTION_RESULT>`
- If Pi exits successfully but does not return a parseable tagged contract, the runner reports failure and Minions falls back to its existing recovery path.
- For `local-git` and `github-pr` delivery, Minions now creates a fresh git worktree per run and executes all repository mutations there, leaving the main repo path unchanged.
- The execution/environment branch is created during environment setup. It is tracked separately from `delivery.branch` semantics: branch existence no longer implies delivery eligibility, because validation and publication gates still decide where delivery stops.
- For `github-pr` delivery, Minions runs phase-aware preflight checks: run-start checks the source repository for `gh`, GitHub auth, git worktree presence, origin remote, and optional clean-worktree enforcement before the isolated worktree is created; delivery checks run inside the isolated worktree before PR publication without re-enforcing worktree cleanliness.
- Structured run data now includes environment/worktree metadata, a single effective repository path, and structured `delivery.stopPoint` records so operators can see exactly where PR delivery stopped.

## Provider labels

- Direct Pi runner results use provider `pi-rpc`.
- GSD-orchestrated runtime results use provider `gsd-team` while preserving the same final result shape.
