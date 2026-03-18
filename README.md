# pi-vs-cc

A collection of [Pi Coding Agent](https://github.com/mariozechner/pi-coding-agent) customized instances. _Why?_ To showcase what it looks like to hedge against the leader in the agentic coding market, Claude Code. Here we showcase how you can customize the UI, agent orchestration tools, safety auditing, and cross-agent integrations. This README also notes that the autonomous GitHub PR delivery path was exercised in a documentation-only test.

<div align="center">
  <img src="./images/pi-logo.png" alt="pi-vs-cc" width="700">
</div>

---

## Prerequisites

All three are required:

| Tool            | Purpose                   | Install                                                    |
| --------------- | ------------------------- | ---------------------------------------------------------- |
| **Bun** ≥ 1.3.2 | Runtime & package manager | [bun.sh](https://bun.sh)                                   |
| **just**        | Task runner               | `brew install just`                                        |
| **pi**          | Pi Coding Agent CLI       | [Pi docs](https://github.com/mariozechner/pi-coding-agent) |

---

## API Keys

Pi does **not** auto-load `.env` files — API keys must be present in your shell's environment **before** you launch Pi. A sample file is provided:

```bash
cp .env.sample .env   # copy the template
# open .env and fill in your keys
```

`.env.sample` covers the four most popular providers:

| Provider         | Variable             | Get your key                                                                                               |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| OpenAI           | `OPENAI_API_KEY`     | [platform.openai.com](https://platform.openai.com/api-keys)                                                |
| Anthropic        | `ANTHROPIC_API_KEY`  | [console.anthropic.com](https://console.anthropic.com/settings/keys)                                       |
| Google           | `GEMINI_API_KEY`     | [aistudio.google.com](https://aistudio.google.com/app/apikey)                                              |
| OpenRouter       | `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai/keys)                                                                |
| Many Many Others | `***`                | [Pi Providers docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/providers.md) |

### Sourcing your keys

Pick whichever approach fits your workflow:

**Option A — Source manually each session:**
```bash
source .env && pi
```

**Option B — One-liner alias (add to `~/.zshrc` or `~/.bashrc`):**
```bash
alias pi='source $(pwd)/.env && pi'
```

**Option C — Use the `just` task runner (auto-wired via `set dotenv-load`):**
```bash
just pi           # .env is loaded automatically for every just recipe
just ext-minimal  # works for all recipes, not just `pi`
```

---

## Installation

```bash
bun install
```

---

## Minions autonomous runtime

For Minions autonomous repository execution, Pi is now the intended runtime path.

- Set `MINIONS_EXECUTION_MODE=agent-runner` to enable autonomous runner mode.
- `.env.sample` now defaults to `agent-runner` because Pi RPC is the intended autonomous execution path.
- Minions will spawn `pi --mode rpc` headlessly for analysis and execution.
- Configure the runtime with `MINIONS_PI_COMMAND`, `MINIONS_PI_PROVIDER`, `MINIONS_PI_MODEL`, `MINIONS_PI_SESSION_DIR`, and `MINIONS_PI_ARGS`.
- `src/server.js` still defaults to `simulated` when env is unset, intentionally, to avoid surprising autonomous execution for contributors who start the app without configuring a runtime.
- See `docs/minions-pi-runner.md` for runner details and tagged JSON output contracts.

---

## Runtime Layout

Project-local Pi runtime assets now live primarily under `.pi/`:

- `.pi/extensions/` — Pi extension source files (.ts)
- `.pi/prompts/commands/` — prompt-template slash commands migrated from `.claude/commands/`
- `.pi/agents/` — project-local agent definitions, teams, and chains
- `.pi/themes/` — custom themes
- `.pi/skills/` — custom skills
- `.pi/settings.json` — Pi workspace settings
- `.pi/damage-control-rules.yaml` — safety rules

Thin compatibility copies remain at the repo root for some moved assets where useful during transition, but `just` and the documented entrypoints now target `.pi/...` first.

## Extensions

| Extension               | File                                    | Description                                                                                                                                               |
| ----------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **pure-focus**          | `.pi/extensions/pure-focus.ts`          | Removes the footer bar and status line entirely — pure distraction-free mode                                                                              |
| **minimal**             | `.pi/extensions/minimal.ts`             | Compact footer showing model name and a 10-block context usage meter `[###-------] 30%`                                                                   |
| **tool-counter**        | `.pi/extensions/tool-counter.ts`        | Rich two-line footer: model + context meter + token/cost stats on line 1, cwd/branch + per-tool call tally on line 2                                    |
| **tool-counter-widget** | `.pi/extensions/tool-counter-widget.ts` | Live-updating above-editor widget showing per-tool call counts with background colors                                                                     |
| **damage-control**      | `.pi/extensions/damage-control.ts`      | Real-time safety auditing — intercepts dangerous bash patterns and enforces path-based access controls from `.pi/damage-control-rules.yaml`               |
| **agent-chain**         | `.pi/extensions/agent-chain.ts`         | Sequential pipeline orchestrator — chains multiple agents where each step's output feeds into the next step's prompt; use `/chain` to select and run      |
| **agent-team**          | `.pi/extensions/agent-team.ts`          | Dispatcher-only orchestrator: the primary agent delegates all work to named specialist agents via `dispatch_agent`; shows a grid dashboard                |
| **session-replay**      | `.pi/extensions/session-replay.ts`      | Scrollable timeline overlay of session history — showcasing customizable dialog UI                                                                        |
| **theme-cycler**        | `.pi/extensions/theme-cycler.ts`        | Keyboard shortcuts (Ctrl+X/Ctrl+Q) and `/theme` command to cycle/switch between custom themes                                                             |

---

## Usage

### Run a single extension

```bash
pi -e .pi/extensions/<name>.ts
```

### Stack multiple extensions

Extensions compose — pass multiple `-e` flags:

```bash
pi -e .pi/extensions/minimal.ts -e .pi/extensions/theme-cycler.ts
```

### Use `just` recipes

`just` wraps the most useful combinations. Run `just` with no arguments to list all available recipes:

```bash
just
```

Common recipes:

```bash
just pi                      # Plain Pi, no extensions
just ext-pure-focus          # Distraction-free mode
just ext-minimal             # Minimal context meter footer
just ext-tool-counter        # Rich two-line footer with tool tally
just ext-tool-counter-widget # Per-tool widget above the editor
just ext-damage-control      # Safety auditing + minimal footer
just ext-agent-chain         # Sequential pipeline orchestrator with step chaining
just ext-agent-team          # Multi-agent orchestration grid dashboard
just ext-session-replay      # Scrollable timeline overlay of session history
just ext-theme-cycler        # Theme cycler + minimal footer
just all                     # Open every extension in its own terminal window
```

The `open` recipe allows you to spin up a new terminal window with any combination of stacked extensions (omit `.ts`):

```bash
just open agent-team theme-cycler
```

---

## Project Structure

```
pi-vs-cc/
├── .pi/
│   ├── agent-sessions/     # Ephemeral session files (gitignored)
│   ├── agents/             # Project-local agent definitions for team and chain extensions
│   │   ├── pi-pi/          # Expert agents for the pi-pi meta-agent
│   │   ├── agent-chain.yaml # Pipeline definition for agent-chain
│   │   ├── teams.yaml      # Team definition for agent-team
│   │   └── *.md            # Individual agent persona/system prompts
│   ├── extensions/         # Pi extension source files (.ts)
│   ├── prompts/
│   │   └── commands/       # Prompt-template slash commands
│   ├── skills/             # Custom skills
│   ├── themes/             # Custom themes (.json) used by theme-cycler
│   ├── damage-control-rules.yaml # Path/command rules for safety auditing
│   └── settings.json       # Pi workspace settings
├── specs/                  # Feature specifications for extensions
├── justfile                # just task definitions
├── CLAUDE.md               # Conventions and tooling reference (for agents)
├── THEME.md                # Color token conventions for extension authors
└── TOOLS.md                # Built-in tool function signatures available in extensions
```

Global reusable Pi assets can also live in `~/.pi/agent/`:
- `~/.pi/agent/agents/*.md` — global agent personas
- `~/.pi/agent/agents/teams.yaml` — global team definitions for `agent-team`
- `~/.pi/agent/agents/agent-chain.yaml` — global chain definitions for `agent-chain`
- `~/.pi/agent/agents/pi-pi/*.md` — global Pi Pi experts and orchestrator prompt
- `~/.pi/agent/extensions/` — global extensions

Precedence is consistent: project-local assets load first and win on agent/team/expert name conflicts; global Pi assets are then added as fallbacks or extra sources. For chain configs, project-defined chains load first and global chains are added only when their names do not already exist.

---

## Orchestrating Multi-Agent Workflows

Pi's architecture makes it easy to coordinate multiple autonomous agents. This playground currently includes two primary multi-agent extensions:

### Agent Teams (`/agents-team`)
The `agent-team` orchestrator operates as a dispatcher. Instead of answering prompts directly, the primary agent reviews your request, selects a specialist from a defined roster, and delegates the work via a `dispatch_agent` tool.
- Teams are configured in `.pi/agents/teams.yaml` for a project, with optional global fallbacks/additions in `~/.pi/agent/agents/teams.yaml`.
- Individual agent personas are discovered project-first from `.pi/agents/`, `.claude/agents/`, and other supported agent directories, then from global Pi agents in `~/.pi/agent/agents/`.
- If a team name exists in both places, the project-local definition wins; global-only teams are added as extra choices.
- **pi-pi Meta-Agent**: The `pi-pi` team specifically delegates tasks to specialized Pi framework experts (`ext-expert.md`, `theme-expert.md`, `tui-expert.md`) located in `.pi/agents/pi-pi/`, with fallback/additional experts from `~/.pi/agent/agents/pi-pi/`.
  - **Web Crawling Fallbacks**: To ingest the latest framework documentation dynamically, these experts use `firecrawl` as their default modern page crawler, but are explicitly programmed to safely fall back to the native `curl` baked into their bash toolset if Firecrawl fails or is unavailable.

### Agent Chains (`/chain`)
Unlike the dynamic dispatcher, `agent-chain` acts as a sequential pipeline orchestrator. Workflows are defined in `.pi/agents/agent-chain.yaml`, with optional global fallback/additional chains in `~/.pi/agent/agents/agent-chain.yaml`, where the output of one agent becomes the input (`$INPUT`) to the next.
- Workflows are defined as a list of `steps`, where each step specifies an `agent` and a `prompt`. 
- The `$INPUT` variable injects the previous step's output (or the user's initial prompt for the first step), and `$ORIGINAL` always contains the user's initial prompt.
- Example: The `plan-build-review` pipeline feeds your prompt to the `planner`, passes the plan to the `builder`, and finally sends the code to the `reviewer`.

---

## Safety Auditing & Damage Control

The `damage-control` extension provides real-time security hooks to prevent catastrophic mistakes when agents execute bash commands or modify files. It uses Pi's `tool_call` event to intercept and evaluate every action against `.pi/damage-control-rules.yaml`.

- **Dangerous Commands**: Uses regex (`bashToolPatterns`) to block destructive commands like `rm -rf`, `git reset --hard`, `aws s3 rm --recursive`, or `DROP DATABASE`. Some rules strictly block execution, while others (`ask: true`) pause execution to prompt you for confirmation.
- **Zero Access Paths**: Prevents the agent from reading or writing sensitive files (e.g., `.env`, `~/.ssh/`, `*.pem`).
- **Read-Only Paths**: Allows reading but blocks modifying system files or lockfiles (`package-lock.json`, `/etc/`).
- **No-Delete Paths**: Allows modifying but prevents deleting critical project configuration (`.git/`, `Dockerfile`, `README.md`).

---

## Extension Author Reference

Companion docs cover the conventions used across all extensions in this repo:

- **[COMPARISON.md](COMPARISON.md)** — Feature-by-feature comparison of Claude Code vs Pi Agent across 12 categories (design philosophy, tools, hooks, SDK, enterprise, and more).
- **[PI_VS_OPEN_CODE.md](PI_VS_OPEN_CODE.md)** — Architectural comparison of Pi Agent vs OpenCode (open-source Claude Code alternative) focusing on extension capabilities, event lifecycle, and UI customization.
- **[RESERVED_KEYS.md](RESERVED_KEYS.md)** — Pi reserved keybindings, overridable keys, and safe keys for extension authors.
- **[THEME.md](THEME.md)** — Color language: which Pi theme tokens (`success`, `accent`, `warning`, `dim`, `muted`) map to which UI roles, with examples.
- **[TOOLS.md](TOOLS.md)** — Function signatures for the built-in tools available inside extensions (`read`, `bash`, `edit`, `write`).

---

## Hooks & Events

Side-by-side comparison of lifecycle hooks in [Claude Code](https://docs.anthropic.com/en/docs/claude-code/hooks) vs [Pi Agent](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md#events).

| Category            | Claude Code                                                      | Pi Agent                                                                                                                | Available In |
| ------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------ |
| **Session**         | `SessionStart`, `SessionEnd`                                     | `session_start`, `session_shutdown`                                                                                     | Both         |
| **Input**           | `UserPromptSubmit`                                               | `input`                                                                                                                 | Both         |
| **Tool**            | `PreToolUse`, `PostToolUse`, `PostToolUseFailure`                | `tool_call`, `tool_result`, `tool_execution_start`, `tool_execution_update`, `tool_execution_end`                       | Both         |
| **Bash**            | —                                                                | `BashSpawnHook`, `user_bash`                                                                                            | Pi           |
| **Permission**      | `PermissionRequest`                                              | —                                                                                                                       | CC           |
| **Compact**         | `PreCompact`                                                     | `session_before_compact`, `session_compact`                                                                             | Both         |
| **Branching**       | —                                                                | `session_before_fork`, `session_fork`, `session_before_switch`, `session_switch`, `session_before_tree`, `session_tree` | Pi           |
| **Agent / Turn**    | —                                                                | `before_agent_start`, `agent_start`, `agent_end`, `turn_start`, `turn_end`                                              | Pi           |
| **Message**         | —                                                                | `message_start`, `message_update`, `message_end`                                                                        | Pi           |
| **Model / Context** | —                                                                | `model_select`, `context`                                                                                               | Pi           |
| **Sub-agents**      | `SubagentStart`, `SubagentStop`, `TeammateIdle`, `TaskCompleted` | —                                                                                                                       | CC           |
| **Config**          | `ConfigChange`                                                   | —                                                                                                                       | CC           |
| **Worktree**        | `WorktreeCreate`, `WorktreeRemove`                               | —                                                                                                                       | CC           |
| **System**          | `Stop`, `Notification`                                           | —                                                                                                                       | CC           |

## Resources

## Pi Documentation

| Doc                                                                                                     | Description                        |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [Mario's Twitter](https://x.com/badlogicgames)                                                          | Creator of Pi Coding Agent         |
| [README.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md)              | Overview and getting started       |
| [sdk.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/sdk.md)               | TypeScript SDK reference           |
| [rpc.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/rpc.md)               | RPC protocol specification         |
| [json.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/json.md)             | JSON event stream format           |
| [providers.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/providers.md)   | API keys and provider setup        |
| [models.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/models.md)         | Custom models (Ollama, vLLM, etc.) |
| [extensions.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) | Extension system                   |
| [skills.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md)         | Skills (Agent Skills standard)     |
| [settings.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/settings.md)     | Configuration                      |
| [compaction.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/compaction.md) | Context compaction                 |

## Master Agentic Coding
> Prepare for the future of software engineering

Learn tactical agentic coding patterns with [Tactical Agentic Coding](https://agenticengineer.com/tactical-agentic-coding?y=pivscc)

Follow the [IndyDevDan YouTube channel](https://www.youtube.com/@indydevdan) to improve your agentic coding advantage.
