# Minions Pi RPC runner

Minions now uses Pi RPC as its autonomous repository execution backend when `MINIONS_EXECUTION_MODE=agent-runner`.

## Environment

Use these environment variables to configure the runner:

- `MINIONS_PI_COMMAND` — Pi CLI command to spawn. Defaults to `pi`.
- `MINIONS_PI_PROVIDER` — optional Pi provider name passed to `pi --mode rpc --provider`.
- `MINIONS_PI_MODEL` — optional model id/pattern passed to `pi --mode rpc --model`.
- `MINIONS_PI_SESSION_DIR` — optional Pi session directory.
- `MINIONS_PI_ARGS` — optional extra CLI args, space-separated.

## Behavior

- Minions sends one headless RPC prompt for task analysis and one for execution.
- Each prompt requires a tagged JSON final-output contract:
  - analysis: `<MINIONS_ANALYSIS_RESULT>...</MINIONS_ANALYSIS_RESULT>`
  - execution: `<MINIONS_EXECUTION_RESULT>...</MINIONS_EXECUTION_RESULT>`
- If Pi exits successfully but does not return a parseable tagged contract, the runner reports failure and Minions falls back to its existing recovery path.
- If repository changes are present but no final contract is returned, Minions attempts worktree-based recovery exactly as before.

## Provider label

Structured runner results now use provider `pi-rpc`.
